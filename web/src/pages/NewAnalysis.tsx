import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTypologies } from '@/hooks/useTypologies'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Upload,
    FileText,
    ArrowLeft,
    Loader2,
    Film,
    PlayCircle,
    Lock,
    Building2,
    Briefcase,
    Check,
    Truck
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    film: Film,
    'play-circle': PlayCircle,
    lock: Lock,
    'building-2': Building2,
    briefcase: Briefcase,
    truck: Truck,
}

export function NewAnalysis() {
    const navigate = useNavigate()
    const { typologies, loading } = useTypologies()
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file || !selectedType) return

        setUploading(true)
        try {
            // Upload file to Supabase Storage
            const filePath = `contracts/${Date.now()}_${file.name}`
            console.log('[Upload] Starting upload to:', filePath)

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(filePath, file)

            if (uploadError) {
                console.error('[Upload] Storage error:', uploadError)
                throw new Error(`Storage: ${uploadError.message}`)
            }

            console.log('[Upload] Storage success:', uploadData)

            // Create document record
            const insertPayload = {
                file_name: file.name,
                file_path: filePath,
                contract_type_id: selectedType,
                status: 'UPLOADED',
                tenant_id: '00000000-0000-0000-0000-000000000001' // Default dev tenant
            }
            console.log('[Upload] Inserting document:', insertPayload)

            const { data: doc, error: docError } = await supabase
                .from('documents')
                .insert(insertPayload)
                .select()
                .single()

            if (docError) {
                console.error('[Upload] Document insert error:', docError)
                throw new Error(`Database: ${docError.message}`)
            }

            console.log('[Upload] Document created:', doc)

            // Navigate to review page
            navigate(`/review/${doc.document_id}`)
        } catch (err) {
            console.error('[Upload] Error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
            alert(`Error: ${errorMessage}\n\nPor favor, revisa la consola para más detalles.`)
        } finally {
            setUploading(false)
        }
    }

    const canUpload = file && selectedType

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Nuevo Análisis</h1>
                    <p className="text-muted-foreground mt-1">
                        Sube un contrato para revisión automática
                    </p>
                </div>
            </div>

            {/* Step 1: Select Contract Type */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">1. Selecciona el tipo de contrato</CardTitle>
                    <CardDescription>
                        Elige la tipología que mejor se ajuste a tu documento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {typologies.map((typology) => {
                                const Icon = typology.icon ? ICON_MAP[typology.icon] || FileText : FileText
                                const isSelected = selectedType === typology.id
                                const isDisabled = !typology.is_active
                                const hasData = typology.examples_count > 0

                                return (
                                    <button
                                        key={typology.id}
                                        onClick={() => !isDisabled && setSelectedType(typology.id)}
                                        disabled={isDisabled}
                                        className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : isDisabled
                                                    ? 'border-border bg-muted cursor-not-allowed opacity-60'
                                                    : 'border-border hover:border-primary/50 cursor-pointer'
                                            }
                    `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className={`h-6 w-6 mt-0.5 ${isDisabled ? 'text-muted-foreground' : typology.color || 'text-primary'}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{typology.name}</span>
                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                    {!hasData && typology.is_active && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Sin datos
                                                        </Badge>
                                                    )}
                                                    {isDisabled && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Próximamente
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {typology.description}
                                                </p>
                                                {hasData && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {typology.matters_count} materias · {typology.examples_count.toLocaleString()} ejemplos
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Upload File */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">2. Sube el archivo</CardTitle>
                    <CardDescription>
                        Arrastra un archivo DOCX o PDF, o haz clic para seleccionar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${file ? 'bg-green-50 border-green-200' : ''}
            `}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".docx,.doc,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileText className="h-10 w-10 text-green-600" />
                                <div className="text-left">
                                    <p className="font-medium text-green-700">{file.name}</p>
                                    <p className="text-sm text-green-600">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFile(null)
                                    }}
                                >
                                    Cambiar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Arrastra tu archivo aquí o{' '}
                                    <span className="text-primary font-medium">haz clic para seleccionar</span>
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Formatos soportados: DOCX, DOC, PDF
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Upload Button */}
            <div className="flex justify-end">
                <Button
                    size="lg"
                    disabled={!canUpload || uploading}
                    onClick={handleUpload}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Iniciar Análisis
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
