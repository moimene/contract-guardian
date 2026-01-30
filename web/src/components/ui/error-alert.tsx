import { AlertCircle, RefreshCw, X, Wifi, Database, FolderOpen, ShieldAlert, HelpCircle } from 'lucide-react'
import { type AppError, type ErrorCategory, ERROR_STYLES } from '@/lib/errors'
import { Button } from './button'

interface ErrorAlertProps {
    error: AppError;
    onDismiss?: () => void;
    onRetry?: () => void;
}

const CATEGORY_ICONS: Record<ErrorCategory, React.ComponentType<{ className?: string }>> = {
    STORAGE_ERROR: FolderOpen,
    DATABASE_ERROR: Database,
    NETWORK_ERROR: Wifi,
    VALIDATION_ERROR: AlertCircle,
    AUTH_ERROR: ShieldAlert,
    UNKNOWN_ERROR: HelpCircle
};

const CATEGORY_TITLES: Record<ErrorCategory, string> = {
    STORAGE_ERROR: 'Error de Almacenamiento',
    DATABASE_ERROR: 'Error de Base de Datos',
    NETWORK_ERROR: 'Error de Conexión',
    VALIDATION_ERROR: 'Error de Validación',
    AUTH_ERROR: 'Error de Autenticación',
    UNKNOWN_ERROR: 'Error'
};

/**
 * ErrorAlert Component
 * Displays categorized errors with retry capability
 * Following error-handling-patterns skill
 */
export function ErrorAlert({ error, onDismiss, onRetry }: ErrorAlertProps) {
    const styles = ERROR_STYLES[error.category];
    const Icon = CATEGORY_ICONS[error.category];
    const title = CATEGORY_TITLES[error.category];

    // Extract raw details as typed string for TypeScript compatibility
    const rawDetails: string | null = error.details?.raw
        ? String(error.details.raw)
        : null;

    return (
        <div
            className={`
        ${styles.bgColor} ${styles.borderColor} ${styles.textColor}
        border rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300
      `}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${styles.iconColor}`} />

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-sm mt-1 opacity-90">{error.userMessage}</p>

                    {import.meta.env.DEV && rawDetails && (
                        <details className="mt-2">
                            <summary className="text-xs opacity-60 cursor-pointer hover:opacity-80">
                                Detalles técnicos
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-x-auto max-w-full whitespace-pre-wrap">
                                {rawDetails}
                            </pre>
                        </details>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {error.retryable && onRetry && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="h-8 px-2 hover:bg-black/5"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reintentar
                        </Button>
                    )}

                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDismiss}
                            className="h-8 w-8 p-0 hover:bg-black/5"
                            aria-label="Cerrar alerta"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
