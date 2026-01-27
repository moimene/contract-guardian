import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, Share2, Database, Zap } from 'lucide-react';

export default function ConfigKnowledgeGraph() {
    return (
        <AppLayout>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
                        <p className="text-muted-foreground mt-2">
                            Visualización del grafo de conocimiento contractual
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Zap className="mr-2 h-4 w-4" />
                            Reindexar
                        </Button>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3 text-purple-800">
                    <Network className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                        El Knowledge Graph conecta materias legales, tipos de cláusulas y sus relaciones para mejorar la detección y análisis.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Nodos (Materias)
                            </CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">20</div>
                            <p className="text-xs text-muted-foreground">
                                categorías principales
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Relaciones
                            </CardTitle>
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">67</div>
                            <p className="text-xs text-muted-foreground">
                                tipos de cláusula vinculados
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Embeddings
                            </CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">85</div>
                            <p className="text-xs text-muted-foreground">
                                vectores generados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Placeholder Graph */}
                <Card className="min-h-[400px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Visualización del Grafo</CardTitle>
                        <CardDescription>
                            Representación interactiva de la taxonomía contractual
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center bg-muted/10 m-6 rounded-lg border border-dashed">
                        <div className="text-center space-y-4">
                            <Network className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Visualización interactiva próximamente</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Exploración de materias → tipos de cláusula → ejemplos
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Structure Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estructura del Grafo</CardTitle>
                        <CardDescription>
                            Jerarquía de la taxonomía contractual
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                                <div>
                                    <h4 className="font-medium">Materias (Matters)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        20 categorías: IP Rights, Indemnification, Liability, Termination, etc.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                                <div>
                                    <h4 className="font-medium">Tipos de Cláusula (Clause Types)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        67 patrones vinculados a materias, con detection hints
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-2 w-2 mt-2 rounded-full bg-purple-500" />
                                <div>
                                    <h4 className="font-medium">Ejemplos (Policy Examples)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        85 ejemplos con embeddings para RAG similarity
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
