import axios from "axios";

export interface RoomPrice {
  roomType: string;
  price: number;
  currency: string;
  availability: number;
}

export interface RoomPricesResponse {
  success: boolean;
  rooms: RoomPrice[];
  error?: string;
  message?: string;
}

export const roomLivePriceService = {
  async getRoomPrices(params: {
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }): Promise<RoomPricesResponse> {
    try {
      const response = await axios.get("/api/rooms-live", {
        params: {
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults || 1,
          children: params.children || 0,
          rooms: params.rooms || 1,
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch live room prices:", error);
      return {
        success: false,
        rooms: [],
        error: "Failed to fetch room prices",
        message: error?.response?.data?.message || "Unable to retrieve live prices from eZee API",
      };
    }
  },
};
