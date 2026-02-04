"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
exports.Constants = {
    public: {
        Enums: {
            anonymization_mode: ["OFF", "DISPLAY_ONLY", "FULL"],
            app_role: ["client", "firm_admin"],
            clause_status: ["SAFE", "RISK"],
            client_state: [
                "OK",
                "RECOMMENDED",
                "REQUIRED",
                "NEEDS_REVIEW",
                "BLOCKED",
            ],
            contract_decision: [
                "PROCESSING",
                "AUTO_REDLINEDRAFT",
                "ESCALATE_HUMAN",
                "BLOCK_EXPORT",
                "READY_FOR_EXPORT",
            ],
            document_status: [
                "UPLOADING",
                "UPLOADED",
                "PROCESSING",
                "PROCESSED",
                "ERROR",
            ],
            run_status: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
        },
    },
};
//# sourceMappingURL=types.js.map