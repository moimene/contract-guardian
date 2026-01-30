/**
 * Error Types for Contract Guardian
 * Following error-handling-patterns skill: Custom exception hierarchy
 */

// ============================================
// Error Categories and Types
// ============================================

export type ErrorCategory =
    | 'STORAGE_ERROR'      // File upload issues
    | 'DATABASE_ERROR'     // Supabase DB issues
    | 'NETWORK_ERROR'      // Connection issues
    | 'VALIDATION_ERROR'   // Input validation
    | 'AUTH_ERROR'         // Authentication issues
    | 'UNKNOWN_ERROR';     // Fallback

export interface AppError {
    category: ErrorCategory;
    code: string;
    message: string;
    userMessage: string;        // User-friendly message
    details?: Record<string, unknown>;
    timestamp: Date;
    retryable: boolean;
}

// ============================================
// Error Factory Functions
// ============================================

export function createAppError(
    category: ErrorCategory,
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    details?: Record<string, unknown>
): AppError {
    return {
        category,
        code,
        message,
        userMessage,
        details,
        timestamp: new Date(),
        retryable
    };
}

// ============================================
// Error Classifiers - Parse raw errors
// ============================================

export function classifySupabaseError(error: unknown): AppError {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const details = { raw: rawMessage };

    // Storage errors
    if (rawMessage.includes('Storage')) {
        if (rawMessage.includes('Bucket not found')) {
            return createAppError(
                'STORAGE_ERROR',
                'BUCKET_NOT_FOUND',
                rawMessage,
                'El sistema de almacenamiento no está configurado. Contacta al administrador.',
                false,
                details
            );
        }
        if (rawMessage.includes('violates row-level security')) {
            return createAppError(
                'AUTH_ERROR',
                'RLS_VIOLATION',
                rawMessage,
                'No tienes permisos para subir archivos. Verifica tu sesión.',
                true,
                details
            );
        }
        if (rawMessage.includes('Payload too large') || rawMessage.includes('size')) {
            return createAppError(
                'VALIDATION_ERROR',
                'FILE_TOO_LARGE',
                rawMessage,
                'El archivo es demasiado grande. El límite es 50MB.',
                false,
                details
            );
        }
        return createAppError(
            'STORAGE_ERROR',
            'STORAGE_GENERIC',
            rawMessage,
            'Error al subir el archivo. Inténtalo de nuevo.',
            true,
            details
        );
    }

    // Database errors
    if (rawMessage.includes('Database') || rawMessage.includes('violates')) {
        if (rawMessage.includes('violates row-level security')) {
            return createAppError(
                'AUTH_ERROR',
                'RLS_VIOLATION',
                rawMessage,
                'No tienes permisos para esta operación. Verifica tu sesión.',
                true,
                details
            );
        }
        if (rawMessage.includes('duplicate key')) {
            return createAppError(
                'DATABASE_ERROR',
                'DUPLICATE_KEY',
                rawMessage,
                'Este documento ya existe en el sistema.',
                false,
                details
            );
        }
        return createAppError(
            'DATABASE_ERROR',
            'DB_GENERIC',
            rawMessage,
            'Error en la base de datos. Inténtalo de nuevo.',
            true,
            details
        );
    }

    // Network errors
    if (rawMessage.includes('fetch') || rawMessage.includes('network') || rawMessage.includes('Failed to fetch')) {
        return createAppError(
            'NETWORK_ERROR',
            'CONNECTION_FAILED',
            rawMessage,
            'Error de conexión. Verifica tu conexión a internet.',
            true,
            details
        );
    }

    // Auth errors
    if (rawMessage.includes('JWT') || rawMessage.includes('auth') || rawMessage.includes('unauthorized')) {
        return createAppError(
            'AUTH_ERROR',
            'AUTH_FAILED',
            rawMessage,
            'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
            true,
            details
        );
    }

    // Fallback
    return createAppError(
        'UNKNOWN_ERROR',
        'UNKNOWN',
        rawMessage,
        'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        true,
        details
    );
}

// ============================================
// Error Display Config
// ============================================

export const ERROR_STYLES: Record<ErrorCategory, {
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
}> = {
    STORAGE_ERROR: {
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500'
    },
    DATABASE_ERROR: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500'
    },
    NETWORK_ERROR: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500'
    },
    VALIDATION_ERROR: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
    },
    AUTH_ERROR: {
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800',
        iconColor: 'text-purple-500'
    },
    UNKNOWN_ERROR: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        iconColor: 'text-gray-500'
    }
};
