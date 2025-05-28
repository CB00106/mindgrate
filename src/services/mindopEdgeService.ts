import { supabase } from './supabaseClient';

export interface MindopServiceResponse {
  success: boolean;
  mindop: {
    id: string;
    name: string;
    description?: string;
  };
  sheetData: {
    sheetId: string;
    sheetName: string;
    data: string[][];
    totalRows: number;
    totalColumns: number;
  };
  timestamp: string;
}

export interface MindopServiceError {
  error: string;
  code?: string;
  details?: string;
}

export interface MindopServiceRequest {
  maxRows?: number;
  sheetName?: string;
}

export class MindopEdgeService {
  /**
   * Calls the mindop-service Edge Function to read Google Sheet data
   * for the authenticated user
   */
  static async getMindopSheetData(
    params: MindopServiceRequest = {}
  ): Promise<MindopServiceResponse> {
    try {
      // Get current session to ensure user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('mindop-service', {
        body: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (!data.success) {
        const errorData = data as MindopServiceError;
        throw new Error(errorData.error || 'Unknown error occurred');
      }

      return data as MindopServiceResponse;

    } catch (error) {
      console.error('MindopEdgeService error:', error);
      throw error;
    }
  }

  /**
   * Test the Edge Function connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      await this.getMindopSheetData({ maxRows: 1 });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Parse sheet data into a more usable format
   */
  static parseSheetData(
    sheetData: MindopServiceResponse['sheetData'],
    hasHeaders: boolean = true
  ): { headers?: string[]; rows: Record<string, string>[] } {
    if (!sheetData.data || sheetData.data.length === 0) {
      return { rows: [] };
    }

    if (hasHeaders && sheetData.data.length > 1) {
      const headers = sheetData.data[0];
      const rows = sheetData.data.slice(1).map(row => {
        const rowObject: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObject[header] = row[index] || '';
        });
        return rowObject;
      });

      return { headers, rows };
    } else {
      // No headers, return rows with numeric indices
      const rows = sheetData.data.map(row => {
        const rowObject: Record<string, string> = {};
        row.forEach((cell, index) => {
          rowObject[index.toString()] = cell;
        });
        return rowObject;
      });

      return { rows };
    }
  }
}

export default MindopEdgeService;
