import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTypologies } from '@/hooks/useTypologies'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ChevronDown,
    ChevronRight,
    BookOpen,
    FileText,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Matter {
    matter_id: string
    matter_code: string
    matter_name: string
    matter_description: string
    clause_types_count: number
    examples_count: number
    acceptable_count: number
    passable_count: number
    unacceptable_count: number
}

interface Example {
    example_id: string
    example_text: string
    acceptance: string
    rationale: string
    proposed_redline: string
    clause_type_name: string
}

export function Playbook() {
    const { typologies, loading: loadingTypologies } = useTypologies()
    const [selectedTypology, setSelectedTypology] = useState<string>('')
    const [matters, setMatters] = useState<Matter[]>([])
    const [loadingMatters, setLoadingMatters] = useState(false)
    const [expandedMatter, setExpandedMatter] = useState<string | null>(null)
    const [examples, setExamples] = useState<Example[]>([])
    const [loadingExamples, setLoadingExamples] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [acceptanceFilter, setAcceptanceFilter] = useState<string>('all')

    // Select first typology with data
    useEffect(() => {
        if (typologies.length > 0 && !selectedTypology) {
            const withData = typologies.find(t => t.examples_count > 0)
            if (withData) setSelectedTypology(withData.code)
        }
    }, [typologies, selectedTypology])

    // Load matters when typology changes
    const fetchMatters = useCallback(async () => {
        if (!selectedTypology) return
        setLoadingMatters(true)
        try {
            const { data, error } = await supabase.rpc('get_typology_matters', {
                p_typology_code: selectedTypology
            })
            if (error) throw error
            setMatters(data || [])
        } catch (err) {
            console.error('Error fetching matters:', err)
        } finally {
            setLoadingMatters(false)
        }
    }, [selectedTypology])

    useEffect(() => {
        fetchMatters()
    }, [fetchMatters])

    // Load examples when a matter is expanded
    const fetchExamples = useCallback(async (matterId: string) => {
        setLoadingExamples(true)
        try {
            const { data, error } = await supabase.rpc('get_matter_examples', {
                p_matter_id: matterId,
                p_acceptance: acceptanceFilter === 'all' ? null : acceptanceFilter.toUpperCase(),
                p_limit: 30
            })
            if (error) throw error
            setExamples(data || [])
        } catch (err) {
            console.error('Error fetching examples:', err)
        } finally {
            setLoadingExamples(false)
        }
    }, [acceptanceFilter])

    const toggleMatter = (matterId: string) => {
        if (expandedMatter === matterId) {
            setExpandedMatter(null)
            setExamples([])
        } else {
            setExpandedMatter(matterId)
            fetchExamples(matterId)
        }
    }

    // Filter matters by search
    const filteredMatters = matters.filter(m =>
        m.matter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.matter_code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getAcceptanceBadge = (acceptance: string) => {
        switch (acceptance) {
            case 'ACCEPTABLE':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Acceptable</Badge>
            case 'PASSABLE':
                return <Badge className="bg-amber-100 text-amber-800"><AlertCircle className="h-3 w-3 mr-1" />Passable</Badge>
            case 'UNACCEPTABLE':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Unacceptable</Badge>
            default:
                return <Badge variant="secondary">{acceptance}</Badge>
        }
    }

    const selectedTypologyData = typologies.find(t => t.code === selectedTypology)

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Playbook
                    </h1>
                    {/* PRD v2.3: Reference Only Badge */}
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                        Reference Only
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Explore matters and reference examples by contract typology
                </p>
                {/* PRD v2.3: Governance Message */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <strong>📘 This Playbook is read-only.</strong> Changes to rules and policies
                    are managed by the Legal Ops team. To request updates,
                    contact the system administrator.
                </div>
            </div>

            {/* Typology Selector */}
            {loadingTypologies ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <Tabs value={selectedTypology} onValueChange={setSelectedTypology} className="mb-6">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${typologies.length}, 1fr)` }}>
                        {typologies.map(t => (
                            <TabsTrigger key={t.code} value={t.code} disabled={t.examples_count === 0}>
                                <span className={t.color}>{t.name}</span>
                                {t.examples_count > 0 && (
                                    <Badge variant="secondary" className="ml-2">{t.examples_count.toLocaleString()}</Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}

            {/* Typology Stats */}
            {selectedTypologyData && (
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{matters.length}</p>
                                <p className="text-sm text-muted-foreground">Matters</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {matters.reduce((s, m) => s + m.acceptable_count, 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">Acceptable</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-600">
                                    {matters.reduce((s, m) => s + m.passable_count, 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">Passable</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    {matters.reduce((s, m) => s + m.unacceptable_count, 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">Unacceptable</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search matter..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={acceptanceFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAcceptanceFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={acceptanceFilter === 'acceptable' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAcceptanceFilter('acceptable')}
                        className="text-green-700"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Acceptable
                    </Button>
                    <Button
                        variant={acceptanceFilter === 'passable' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAcceptanceFilter('passable')}
                        className="text-amber-700"
                    >
                        <AlertCircle className="h-4 w-4 mr-1" /> Passable
                    </Button>
                    <Button
                        variant={acceptanceFilter === 'unacceptable' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAcceptanceFilter('unacceptable')}
                        className="text-red-700"
                    >
                        <XCircle className="h-4 w-4 mr-1" /> Unacceptable
                    </Button>
                </div>
            </div>

            {/* Matters List */}
            {loadingMatters ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredMatters.map(matter => (
                        <Card key={matter.matter_id} className={expandedMatter === matter.matter_id ? 'ring-2 ring-primary' : ''}>
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleMatter(matter.matter_id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {expandedMatter === matter.matter_id ? (
                                            <ChevronDown className="h-5 w-5 text-primary" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <CardTitle className="text-base">{matter.matter_name}</CardTitle>
                                            <CardDescription className="text-sm">{matter.matter_description}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            {matter.acceptable_count > 0 && (
                                                <Badge className="bg-green-100 text-green-800">{matter.acceptable_count}</Badge>
                                            )}
                                            {matter.passable_count > 0 && (
                                                <Badge className="bg-amber-100 text-amber-800">{matter.passable_count}</Badge>
                                            )}
                                            {matter.unacceptable_count > 0 && (
                                                <Badge className="bg-red-100 text-red-800">{matter.unacceptable_count}</Badge>
                                            )}
                                        </div>
                                        <Badge variant="outline">{matter.examples_count} examples</Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Expanded examples */}
                            {expandedMatter === matter.matter_id && (
                                <CardContent className="border-t">
                                    {loadingExamples ? (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : examples.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-6">
                                            No examples with the selected filter
                                        </p>
                                    ) : (
                                        <div className="space-y-4 mt-4">
                                            {examples.map(ex => (
                                                <div key={ex.example_id} className="p-4 rounded-lg bg-muted/30 border">
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        {getAcceptanceBadge(ex.acceptance)}
                                                        {ex.clause_type_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <FileText className="h-3 w-3 mr-1" />
                                                                {ex.clause_type_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-relaxed mb-3">{ex.example_text}</p>
                                                    {ex.rationale && (
                                                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                                            <strong>Rationale:</strong> {ex.rationale}
                                                        </div>
                                                    )}
                                                    {ex.proposed_redline && (
                                                        <div className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2">
                                                            <strong>Suggested redline:</strong> {ex.proposed_redline}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
