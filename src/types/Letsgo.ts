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
    photos: string[];
    ticketTakers: string[];
    listNames: string[];
    useruid: string;
    establishmentId: string;
    establishment: any;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
    needsApproval?: boolean;
    promoterId?: string;
    promoter?: {
        id: string;
        name: string;
        email: string;
    };
    tickets?: any[];
}