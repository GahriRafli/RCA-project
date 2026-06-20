// Master data for dropdown options
export const APPLICATIONS = [
  'Core Banking System',
  'Mobile Banking',
  'Internet Banking',
  'ATM Gateway',
  'Payment Gateway',
  'SWIFT Messaging',
  'RTGS System',
  'SKN/Kliring',
  'E-Wallet Service',
  'Credit Scoring Engine',
  'Loan Origination System',
  'Anti-Fraud Detection',
  'CRM Platform',
  'HR Information System',
  'Data Warehouse',
  'API Gateway',
  'Notification Service',
  'Email Server',
  'Active Directory',
  'VPN Gateway',
];

export const DEPARTMENTS = [
  'IT Operations',
  'IT Infrastructure',
  'IT Security',
  'IT Development',
  'IT Architecture',
  'Digital Banking',
  'Network Operations',
  'Database Administration',
  'Business Intelligence',
  'IT Service Desk',
];

export const SME_LIST = [
  'Ahmad Faruq',
  'Budi Santoso',
  'Citra Dewi',
  'Dimas Prasetyo',
  'Eka Putri',
  'Farhan Rizky',
  'Gita Nuraini',
  'Hendra Wijaya',
  'Irfan Maulana',
  'Joko Susilo',
  'Kartika Sari',
  'Lukman Hakim',
  'Maya Anggraeni',
  'Nur Hidayat',
  'Omar Bakri',
];

export const SEVERITY_LEVELS = [
  { value: 'Low', label: 'Low', description: '< 10% traffic terimpact', color: '#1DD1A1' },
  { value: 'Medium', label: 'Medium', description: '10% - 50% traffic terimpact', color: '#FECA57' },
  { value: 'High', label: 'High', description: '> 50% traffic terimpact', color: '#FF6B6B' },
];

export const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open', color: '#FF6B6B' },
  { value: 'In Progress', label: 'In Progress', color: '#FECA57' },
  { value: 'Resolved', label: 'Resolved', color: '#48DBFB' },
  { value: 'Closed', label: 'Closed', color: '#1DD1A1' },
];

export const WORKFLOW_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const WORKFLOW_COLORS = {
  'Draft': '#A0A0B0',
  'Pending Review': '#FECA57',
  'Approved': '#1DD1A1',
  'Rejected': '#FF6B6B',
};

export const ROLES = {
  MAKER: 'maker',
  CHECKER: 'checker',
  SUPERADMIN: 'superadmin',
};

export const DEMO_USERS = [
  { id: 'usr-001', nip: '10240001', password: 'maker123', name: 'Andi Pratama', role: 'maker', department: 'IT Operations' },
  { id: 'usr-002', nip: '10240002', password: 'checker123', name: 'Siti Rahayu', role: 'checker', department: 'IT Operations' },
  { id: 'usr-003', nip: '10240003', password: 'admin123', name: 'Rudi Hartono', role: 'superadmin', department: 'IT Operations' },
];
