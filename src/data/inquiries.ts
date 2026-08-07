export type InquiryStatus = "New" | "In progress" | "Resolved";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  status: InquiryStatus;
  submittedAt: string;
};

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "New",
  "In progress",
  "Resolved",
];

export const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: "INQ-001",
    name: "Rosa Mendoza",
    email: "rosa.mendoza@example.com",
    type: "Catering",
    message:
      "Can I request a buffet package for a 70-person birthday celebration?",
    status: "New",
    submittedAt: "Today, 10:20 AM",
  },
  {
    id: "INQ-002",
    name: "Paolo Garcia",
    email: "paolo.garcia@example.com",
    type: "Function Room",
    message:
      "I would like to know if the Main Hall is available for a company event.",
    status: "In progress",
    submittedAt: "Yesterday, 4:45 PM",
  },
];

const STORAGE_KEY = "capitol-inquiries";

export function getInquiries(): Inquiry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_INQUIRIES;

  try {
    return JSON.parse(stored) as Inquiry[];
  } catch {
    return INITIAL_INQUIRIES;
  }
}

export function saveInquiries(inquiries: Inquiry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
}
