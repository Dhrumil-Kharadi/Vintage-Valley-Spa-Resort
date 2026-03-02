import axios from "axios";

export interface DatabaseRoom {
  id: number;
  title: string;
  description: string;
  pricePerNight: number;
  epPricePerNight: number | null;
  cpPricePerNight: number | null;
  mapPricePerNight: number | null;
  person: number;
  availableRooms: number;
  images: Array<{
    id: string;
    roomId: number;
    url: string;
    sortOrder: number;
  }>;
  amenities: Array<{
    id: string;
    roomId: number;
    name: string;
  }>;
  updatedAt: string;
}

export interface DatabaseRoomsResponse {
  success: boolean;
  rooms: DatabaseRoom[];
  error?: string;
}

export const roomDatabaseService = {
  async getDatabaseRooms(): Promise<DatabaseRoomsResponse> {
    try {
      const response = await axios.get("/api/rooms-live/database", {
        withCredentials: true,
      });

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch database rooms:", error);
      return {
        success: false,
        rooms: [],
        error: "Failed to fetch rooms from database",
      };
    }
  },

  async syncPrices(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await axios.post("/api/rooms-live/sync", {}, {
        withCredentials: true,
      });

      return response.data;
    } catch (error: any) {
      console.error("Failed to sync prices:", error);
      return {
        success: false,
        error: error?.response?.data?.error || "Failed to sync prices",
      };
    }
  },
};
