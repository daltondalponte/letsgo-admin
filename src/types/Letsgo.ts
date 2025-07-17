export interface Establishment {
    id: string
    name: string
    address: string
    photos: any[]
    createdAt: string
    updatedAt: string
    coordinates: string
}

export interface Event {
    id: string;
    name: string;
    description: string;
    dateTimestamp: string;
    endTimestamp?: string;
    address?: string;
    photos: string[];
    listNames: string[];
    isActive: boolean;
    establishmentId?: string;
    useruid?: string;
    coordinates_event?: any;
    establishment?: Establishment;
    user?: User;
    ManageEvents?: EventManager[];
    Ticket?: Ticket[];
    // Propriedades opcionais para compatibilidade com o backend e frontend
    approvalStatus?: string;
    creator?: {
        name?: string;
        email?: string;
        type?: string;
    };
    tickets?: Ticket[];
    managers?: any[];
}

// Tipos auxiliares para evitar erros de linter
export interface User {
    uid: string;
    email: string;
    name: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    avatar?: string;
    document?: string;
    isActive: boolean;
    isOwnerOfEstablishment?: boolean;
    stripeAccountId?: string;
    stripeCustomerId?: string;
    deviceToken?: string;
    birthDate?: string;
    phone?: string;
}

export interface EventManager {
    id: string;
    user?: User;
    name?: string;
}

export interface Ticket {
    id: string;
    description: string;
    price: number;
    quantity_available: number;
    quantity_sold?: number;
    eventId: string;
    event?: Event;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
}