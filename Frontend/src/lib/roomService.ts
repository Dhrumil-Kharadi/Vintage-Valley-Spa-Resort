import axios from 'axios';

export interface RoomPrice {
  roomType: string;
  price: number;
  currency: string;
  availability: number;
}

export interface RoomListResponse {
  ok: boolean;
  data: {
    rooms: Array<{
      roomtypeunkid: string;
      roomrateunkid?: string;
      ratetypeunkid?: string;
      Room_Name: string;
      Room_Description: string;
      max_adult_occupancy: number;
      max_child_occupancy: number;
      available_rooms: number;
      avg_price_per_night: number;
      pricePerNight?: number;
      total_price: number;
      currency_sign: string;
      RoomAmenities: string;
      room_main_image?: string;
      Roomtype_Short_code?: string;
      extra_adult_rates_info?: any;
      extra_child_rates_info?: any;
      // Discount fields
      original_price?: number;
      discount_amount?: number;
      final_price?: number;
      promo_applied?: boolean;
      // Rack rate fields for EP/CP/MAP pricing
      rack_rate?: number;
      rack_rate_adult?: number;
      rack_rate_child?: number;
    }>;
  };
  meta?: {
    cached?: boolean;
  };
  message?: string;
  error?: string;
}

export interface RoomPricesResponse {
  success: boolean;
  rooms: RoomPrice[];
  error?: string;
  message?: string;
}

export interface RoomRawResponse {
  success: boolean;
  rooms: any[];
  error?: string;
  message?: string;
}

export const roomService = {
  async getRoomPrices(params: {
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }): Promise<RoomPricesResponse> {
    try {
      const response = await axios.get('/api/rooms/prices', {
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
      console.error('Failed to fetch room prices:', error);
      
      // Return a formatted error response
      return {
        success: false,
        rooms: [],
        error: 'Failed to fetch room prices',
        message: error?.response?.data?.message || 'Unable to retrieve live prices from eZee API',
      };
    }
  },

  async getRawRoomList(params: {
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }): Promise<RoomRawResponse> {
    try {
      const response = await axios.get('/api/rooms/raw', {
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
      console.error('Failed to fetch raw room list:', error);

      const backendMessageRaw =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.error?.message ||
        error?.message;

      const backendMessage =
        typeof backendMessageRaw === 'string'
          ? backendMessageRaw
          : backendMessageRaw && typeof backendMessageRaw === 'object' && 'message' in backendMessageRaw
            ? String((backendMessageRaw as any).message)
            : backendMessageRaw != null
              ? String(backendMessageRaw)
              : '';

      return {
        success: false,
        rooms: [],
        error: 'Failed to fetch room list',
        message: backendMessage || 'Unable to retrieve live rooms from eZee API',
      };
    }
  },

  async getRoomList(params: {
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }): Promise<RoomListResponse> {
    try {
      const response = await axios.get('/api/rooms', {
        params: {
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults || 1,
          children: params.children || 0,
          rooms: params.rooms || 1,
        },
        withCredentials: true,
      });

      console.log('[FRONTEND API DEBUG] Raw response from /api/rooms:', response.data);
      console.log('[FRONTEND API DEBUG] Rooms data:', response.data?.data?.rooms);
      
      // Log price details for each room
      if (response.data?.data?.rooms) {
        response.data.data.rooms.forEach((room: any, index: number) => {
          console.log(`[FRONTEND API DEBUG] Room ${index + 1}:`, {
            name: room.Room_Name,
            avg_price_per_night: room.avg_price_per_night,
            pricePerNight: room.pricePerNight,
            total_price: room.total_price,
            final_price: room.final_price
          });
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch room list:', error);
      
      // Return a formatted error response
      return {
        ok: false,
        data: { rooms: [] },
        meta: {},
      };
    }
  },
};
