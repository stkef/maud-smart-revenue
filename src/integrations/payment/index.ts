// Payment module exports
export {
  processPayment,
  getPaymentStatus,
  processRefund,
  getPaymentHistory,
  getTotalPaid,
  setPaymentGateway,
  getGatewayInfo,
} from './paymentService';

export {
  mockPaymentGateway,
  getAllPayments,
  getTaxpayerPayments,
  clearPaymentStore,
  getTaxpayerTotalPaid,
} from './mockGateway';

export type {
  PaymentMethod,
  TransactionStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentRecord,
  PaymentGatewayInterface,
  PaymentCallbacks,
} from './types';
