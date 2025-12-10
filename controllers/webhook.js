const router = require('express').Router();
const sequelize = require('../utils/db');
const { webhookLocalBankTransferSchema } = require('../helpers/formValidator');
const { validateRoutingNumber } = require('../helpers/validateRoutingNum');
const {Customers, AccountHistory, PendingTransactions, Accounts} = require('../models/index');
const { calculateAvailableAndCurrentBalance } = require('../utils/calculateAvailableAndCurrentBalance');
const CONFIG = require('../utils/config');
const { sendToClient } = require('./serverEvents');
const { currencyFormatter } = require('../utils/formatter');

const TRANSACTION_TYPE = {
  credit: 'credit',
  debit: 'debit'
}

const webhookToken = 'Verify-Key';
router.post('/local-payment/N-P-webhook', async (req, res, next) => {
  const authToken = req.get(webhookToken);
  if (authToken !== CONFIG.NATIONAL_PAYMENT_WEBHOOK_SECRET_HASH) {
    return res.status(401).send();
  }

  const transferValidation = await webhookLocalBankTransferSchema.validate(req.body);

  let transaction;
  try {
    const currentAccount = await Accounts.findOne({where:{accountNumber: transferValidation.receiverAcct}});
    if (!currentAccount) {
      return res.status(400).send();
    }
    const getNewBalance = calculateAvailableAndCurrentBalance(currentAccount, transferValidation.amount, TRANSACTION_TYPE.credit );

    transaction = await sequelize.transaction();

    await currentAccount.createLocal_transfer({
      entry: TRANSACTION_TYPE.credit,
      description: transferValidation.description,
      amount: transferValidation.amount,
      bankName: transferValidation.senderBankName,
      accountNumber: transferValidation.senderAcct,
      routingNumber: transferValidation.senderBankRN,
      accountName: transferValidation.senderName,
      status: 'completed',
      trxnId: transferValidation.trxId,
    },{transaction});

    await currentAccount.createTransaction({
      entry: TRANSACTION_TYPE.credit,
      transactionType: 'local',
      description: transferValidation.description,
      amount: transferValidation.amount,
      balance: getNewBalance.newAvailableBalance,
      trxnId: transferValidation.trxId,
      charge: 0
    }, {transaction})

    const infoToUpdate = {
      availableBalance: getNewBalance.newAvailableBalance,
      currentBalance: getNewBalance.newCurrentBalance
    }

    await currentAccount.update(infoToUpdate, {transaction})

    await transaction.commit();
    
    res.status(200).send();

    sendToClient(currentAccount.customer_id, {message: `account credited with ${currencyFormatter(transferValidation.amount)}`, amount: transferValidation.amount, type: "notification"});

    return;
  } catch (error) {
    await transaction.rollback();
    console.log(error);
  }
    
})

module.exports = router;