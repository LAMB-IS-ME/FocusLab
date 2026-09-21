export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Hợp đồng RPC; Zod kiểm tra dữ liệu trả về trước khi đưa vào state.
export type Database = {
  public: {
    Tables: Record<never, never>
    Views: Record<never, never>
    Functions: {
      get_workspace: { Args: Record<never, never>; Returns: Json }
      apply_workspace_changes: {
        Args: { changes: Json; expected_user_id: string }
        Returns: Json
      }
      reset_workspace: { Args: { expected_user_id: string }; Returns: undefined }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
