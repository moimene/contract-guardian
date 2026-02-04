// Supabase Edge Function: extract_text
// Uses Aspose Words Cloud for PDF/DOCX text extraction (Deno compatible)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get Aspose OAuth Token
async function getAsposeToken(): Promise<string> {
    const clientId = Deno.env.get('ASPOSE_CLIENT_ID')
    const clientSecret = Deno.env.get('ASPOSE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
        throw new Error('Aspose credentials not configured')
    }

    const response = await fetch('https://api.aspose.cloud/connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    })

    if (!response.ok) {
        throw new Error(`Aspose auth failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
}

// Extract text using Aspose Words Cloud
async function extractTextWithAspose(fileData: Blob, fileName: string): Promise<string> {
    const token = await getAsposeToken()

    // 1. Upload file to Aspose Storage
    const uploadUrl = `https://api.aspose.cloud/v4.0/words/storage/file/${encodeURIComponent(fileName)}`
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream'
        },
        body: fileData
    })

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Aspose upload failed: ${uploadResponse.status} - ${errorText}`)
    }

    // 2. Convert to TXT (extracts all text)
    const convertUrl = `https://api.aspose.cloud/v4.0/words/${encodeURIComponent(fileName)}?format=txt`
    const convertResponse = await fetch(convertUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!convertResponse.ok) {
        const errorText = await convertResponse.text()
        throw new Error(`Aspose convert failed: ${convertResponse.status} - ${errorText}`)
    }

    const text = await convertResponse.text()

    // 3. Cleanup: Delete the uploaded file
    await fetch(uploadUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => { }) // Ignore cleanup errors

    return text
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { document_id } = await req.json()

        if (!document_id) throw new Error('document_id is required')

        // 1. Get file path from storage_path column
        const { data: doc, error: docError } = await supabaseClient
            .from('documents')
            .select('storage_path, file_name')
            .eq('document_id', document_id)
            .single()

        if (docError || !doc) throw new Error('Document not found')
        if (!doc.storage_path) throw new Error('Document storage_path is null')

        console.log(`Extracting text for document ${document_id} at ${doc.storage_path}`)

        // 2. Download file from Storage - use storage_path directly
        // storage_path format: "contracts/{document_id}/{filename}" 
        // Need to remove "contracts/" prefix since bucket is already 'contracts'
        const storagePath = doc.storage_path.replace(/^contracts\//, '')

        const { data: fileData, error: fileError } = await supabaseClient
            .storage
            .from('contracts')
            .download(storagePath)

        if (fileError) throw new Error(`Download failed: ${fileError.message}`)

        // 3. Extract text using Aspose
        const fileName = doc.file_name || doc.storage_path.split('/').pop() || 'document.pdf'
        const text = await extractTextWithAspose(fileData, fileName)

        console.log(`Extracted ${text.length} characters from ${fileName}`)

        return new Response(
            JSON.stringify({ success: true, text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Extract error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
