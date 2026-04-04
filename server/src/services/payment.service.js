const { v4: uuidv4 } = require('uuid');

/**
 * BAC payment gateway placeholder.
 *
 * This service simulates the BAC payment integration for the MVP.
 * In production it will be replaced with the real BAC API calls.
 */
const PaymentService = {
  /**
   * Initialize a simulated payment transaction.
   *
   * @param {Object} orderData - The order to pay for
   * @param {string} orderData.order_number
   * @param {number} orderData.amount
   * @param {string} orderData.currency
   * @returns {Object} Simulated payment initiation response
   */
  async initializePayment(orderData) {
    // Simulate BAC payment initiation
    const transactionId = uuidv4();

    return {
      success: true,
      transaction_id: transactionId,
      payment_url: `https://sandbox.bac.net/pay?txn=${transactionId}`,
      order_number: orderData.order_number,
      amount: orderData.amount,
      currency: orderData.currency,
      status: 'pending',
      message: 'Payment initiated. Redirect user to payment_url.',
      // In production: this URL would come from BAC's API response
    };
  },

  /**
   * Verify / process a simulated BAC payment callback.
   *
   * @param {Object} callbackData - Data received from BAC webhook
   * @param {string} callbackData.transaction_id
   * @param {string} callbackData.status
   * @param {string} callbackData.order_number
   * @returns {Object} Simulated verification result
   */
  async verifyPayment(callbackData) {
    // In production: validate signature, verify with BAC API
    const isValid = callbackData.transaction_id && callbackData.order_number;

    return {
      success: isValid,
      verified: isValid,
      transaction_id: callbackData.transaction_id,
      order_number: callbackData.order_number,
      status: isValid ? 'paid' : 'failed',
      payment_reference: callbackData.transaction_id,
      payment_method: 'bac_placeholder',
      payment_date: new Date(),
      message: isValid
        ? 'Payment verified successfully (simulated).'
        : 'Payment verification failed (simulated).',
    };
  },
};

module.exports = PaymentService;
