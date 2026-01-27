import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getPlaybookId, getReviewConfig, uploadContractToN8n, startContractReview, FileUploadPayload, ContractReviewPayload } from '@/services/n8nService';
import { supabase } from '@/integrations/supabase/client';

export default function NewAnalysis() {
    const [file, setFile] = useState<File | null>(null);
    const [contractType, setContractType] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file || !contractType || !user) return;

        try {
            setUploading(true);

            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${user.organization_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get 3-layer configuration
            const reviewConfig = await getReviewConfig(contractType);

            // 3. Prepare payload for W1 (File Upload)
            const uploadPayload: FileUploadPayload = {
                file_name: file.name,
                file_path: filePath,
                mime_type: file.type,
                tenant_id: user.organization_id,
                ...(reviewConfig
                    ? { blueprint_version_id: reviewConfig.blueprint_version_id }
                    : { playbook_id: getPlaybookId(contractType) }
                ),
            };

            const uploadResult = await uploadContractToN8n(uploadPayload);

            // 4. Prepare payload for W3 (Contract Review)
            const reviewPayload: ContractReviewPayload = {
                document_id: uploadResult.document_id,
                tenant_id: user.organization_id,
                ...(reviewConfig
                    ? {
                        blueprint_version_id: reviewConfig.blueprint_version_id,
                        contract_model_version_id: reviewConfig.contract_model_version_id || undefined,
                    }
                    : { playbook_id: getPlaybookId(contractType) }
                ),
            };

            await startContractReview(reviewPayload);

            toast({
                title: "Análisis iniciado",
                description: "El contrato se está analizando. Recibirás una notificación cuando termine.",
            });

            navigate('/dashboard');

        } catch (error: any) {
            console.error('Error starting analysis:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudo iniciar el análisis",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <AppLayout>
            <div className="container max-w-3xl mx-auto py-8">
                <h1 className="text-3xl font-bold mb-2">Nuevo Análisis</h1>
                <p className="text-muted-foreground mb-8">
                    Sube un contrato para analizarlo contra el playbook de Amazon.
                </p>

                <div className="grid gap-8">
                    {/* Step 1: File Upload */}
                    <Card className={step === 1 ? 'border-primary ring-1 ring-primary' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step > 1 ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                                    }`}>
                                    {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                                </div>
                                Subir Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${file ? 'border-green-200 bg-green-50' : 'border-muted-foreground/25 hover:border-primary/50'
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-12 w-12 text-green-600" />
                                        <p className="font-medium text-lg">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            Cambiar archivo
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-1">Arrastra tu archivo aquí</h3>
                                        <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar</p>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf,.docx,.doc"
                                            onChange={handleFileChange}
                                        />
                                        <Button variant="outline" asChild>
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                Seleccionar Archivo
                                            </label>
                                        </Button>
                                    </>
                                )}
                            </div>
                            {file && step === 1 && (
                                <div className="flex justify-end mt-4">
                                    <Button onClick={() => setStep(2)}>
                                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2: Configuration */}
                    <Card className={step === 2 ? 'border-primary ring-1 ring-primary' : 'opacity-50'}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    2
                                </div>
                                Configuración del Análisis
                            </CardTitle>
                            <CardDescription className="ml-10">
                                Selecciona el tipo de contrato para aplicar las reglas correctas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="ml-10 space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Tipo de Contrato</label>
                                    <Select
                                        value={contractType}
                                        onValueChange={setContractType}
                                        disabled={step !== 2}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="amazon-psa">Amazon PSA (Production Services Agreement)</SelectItem>
                                            <SelectItem value="amazon-dsa">Amazon DSA (Development Services Agreement)</SelectItem>
                                            <SelectItem value="nueva-planta-epc">Nueva Planta EPC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {step === 2 && (
                                    <div className="flex justify-between mt-6">
                                        <Button variant="ghost" onClick={() => setStep(1)}>
                                            Atrás
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!contractType || uploading}
                                        >
                                            {uploading ? 'Procesando...' : 'Iniciar Análisis'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
