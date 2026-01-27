import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Book, Shield, AlertTriangle } from 'lucide-react';

export default function ConfigPlaybooks() {
    return (
        <AppLayout>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Playbooks</h1>
                        <p className="text-muted-foreground mt-2">
                            Blueprints de revisión configurados para tu organización
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Book className="mr-2 h-4 w-4" />
                            Documentación
                        </Button>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                        Los Playbooks definen las reglas y políticas que se aplican durante la revisión de contratos.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Materias Legales
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">20</div>
                            <p className="text-xs text-muted-foreground">
                                categorías de revisión
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tipos de Cláusula
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">67</div>
                            <p className="text-xs text-muted-foreground">
                                patrones detectables
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ejemplos de Política
                            </CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">85</div>
                            <p className="text-xs text-muted-foreground">
                                +1,282 pendientes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Blueprint Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">Amazon PSA Blueprint</CardTitle>
                                <CardDescription className="mt-2">
                                    Blueprint activo para contratos Amazon Production Services Agreement
                                </CardDescription>
                            </div>
                            <Badge className="bg-green-600">
                                Activo
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Versión</span>
                                    <span className="text-muted-foreground">v1.0</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Tipología asignada</span>
                                    <span className="font-mono text-sm">amazon-psa</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Políticas por materia</span>
                                    <span className="text-muted-foreground">20 materias configuradas</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Fallback clauses</span>
                                    <span className="text-muted-foreground">50 cláusulas alternativas</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Coming Soon */}
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-muted-foreground">Próximamente</CardTitle>
                        <CardDescription>
                            Gestión visual de blueprints y políticas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Editor de políticas por materia legal</li>
                            <li>Gestión de ejemplos aceptables/inaceptables</li>
                            <li>Configuración de cláusulas de fallback</li>
                            <li>Versionado y publicación de blueprints</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
