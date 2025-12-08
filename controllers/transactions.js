const router = require('express').Router();
const { Op } = require("sequelize");
const sequelize = require('../utils/db')
const ibanTools = require('ibantools');
const axios = require('axios');
const CONFIG = require('../utils/config');
const { sameBankTransferSchema, domesticWireTransferSchema, internationalWireTransferSchema, billpayTransferSchema, extLocalBankTransferSchema } = require('../helpers/formValidator');
const { validateRoutingNumber } = require('../helpers/validateRoutingNum');
const {Customers, AccountHistory, PendingTransactions, Accounts} = require('../models/index');
const { calculateAvailableAndCurrentBalance } = require('../utils/calculateAvailableAndCurrentBalance');
const { formatDollarToCent, generateTransactionId } = require('../helpers/formatters');
const { sendToClient } = require('./serverEvents');
const { currencyFormatter } = require('../utils/formatter');

const localTransferURL = 'http://localhost:8080/send-payment';

const TRANSACTION_TYPE = {
  credit: 'credit',
  debit: 'debit'
}
const TRANSFER_TYPE = {
  billpay: 'billpay',
  domesticWire: 'domesticWire',
  internationalWire: 'internationalWire',
  neft: 'NEFT',
  local: 'local'
}

const  LOCAL = 'local';
const INTERNAL = 'internal';
const CARD_DEBIT = 'card_debit';
const WITHDRAWAL = 'withdrawal';
const INTERNALTIONAL_WIRE = 'international_wire';
const LOCAL_WIRE = 'local_wire';
const BILL_PAYMENT   = "bill_payment";

const WIRE_FEE = 30;

router.post('/internal/neft', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await sameBankTransferSchema.validate(req.body);
  // NEFT (National Electronic Fund Transfer)

  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const currentCustomer = await Customers.findOne({where:{id: id},
      include: [Accounts],
      attributes: {
      exclude: ['createdAt', 'updatedAt']
      }
    });
    const currentAccount = currentCustomer.get('account');

    if (Number(currentAccount.accountNumber) === transferValidation.accountNumber) {
      return res.status(400).send({success: false, message: 'self transfer rejected'});
    }
    
    const transactionAmount = formatDollarToCent(transferValidation.amount);
    const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentAccount, transactionAmount, TRANSACTION_TYPE.debit );

    console.log("TRAS AM", transactionAmount)
    if (getSenderNewBalance.newAvailableBalance <= 0  ) {
      console.log("SENDER BAL", getSenderNewBalance)
      return res.status(400).send({success: false, message: 'insufficient funds'});
    }

    const verifyReceiver = await Accounts.findOne({
      where: {
        accountNumber: transferValidation.accountNumber,
        accountStatus: {
          [Op.ne]: 'closed'
        }
      },
    })
    if (!verifyReceiver) {
      console.log("ACCOUN INVALID")
      return res.status(400).send({success: false, message: 'account number invalid'});
    }
    console.log("VERIFY RECEIVER", verifyReceiver.accountNumber)
    const generateTrxnId = generateTransactionId();

    await currentAccount.createInternal_transfer({
      receiverAccountId: verifyReceiver.id,
      description: transferValidation.description,
      amount: transferValidation.amount,
      transactionStatus: 'completed',
      trxnId: generateTrxnId
    },{transaction});

    await currentAccount.createTransaction({
      entry: TRANSACTION_TYPE.debit,
      transactionType: INTERNAL,
      description: transferValidation.description,
      amount: transactionAmount,
      balance: getSenderNewBalance.newAvailableBalance,
      trxnId: generateTrxnId,
      charge: 0
    }, {transaction})
    
    await Accounts.update({
      availableBalance: getSenderNewBalance.newAvailableBalance,
      currentBalance: getSenderNewBalance.newCurrentBalance
    }, {
      where: {
        id: currentAccount.id
      }
    },{transaction})

    const getReceiverNewBalance = calculateAvailableAndCurrentBalance(verifyReceiver, transactionAmount, TRANSACTION_TYPE.credit );

    await verifyReceiver.createTransaction({
      entry: TRANSACTION_TYPE.credit,
      transactionType: INTERNAL,
      description: transferValidation.description,
      amount: transactionAmount,
      balance: getReceiverNewBalance.newAvailableBalance,
      trxnId: generateTrxnId,
      charge: 0
    }, {transaction})

    await Accounts.update({
      availableBalance: getReceiverNewBalance.newAvailableBalance,
      currentBalance: getReceiverNewBalance.newCurrentBalance
    }, {
      where: {
        id: verifyReceiver.id
      }
    }, {transaction})

    await transaction.commit();

    res.status(200).send({success: true, message: 'transfer sent'});

    // sendToClient(currentCustomer.id, {message: `You sent ${currencyFormatter(transactionAmount)}`, amount: transactionAmount, type: "notification"});
    sendToClient(verifyReceiver.customer_id, {message: `account credited with ${currencyFormatter(transactionAmount)}`, amount: transactionAmount, type: "notification"});
  } catch (error) {
    await transaction.rollback()
    console.log(error);
  }
})

router.post('/local/national-transfer', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await extLocalBankTransferSchema.validate(req.body);
  // NEFT (National Electronic Fund Transfer)
  let transaction;
    try {
      transaction = await sequelize.transaction();

      const currentCustomer = await Customers.findOne({where:{id: id},
        include: [Accounts],
        attributes: {
        exclude: ['createdAt', 'updatedAt']
        }
      });

      const currentAccount = currentCustomer.get('account');

      const transactionAmount = formatDollarToCent(transferValidation.amount);
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentAccount, transactionAmount, TRANSACTION_TYPE.debit );

      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'insufficient balance'});
      }

      const headers = {
        'Content-Type': 'application/json',
        'Private-Token': CONFIG.NATIONAL_PAYMENT_SECRET_KEY
      }

      const paymentData = {
        amount: transactionAmount,
        receivingAcct: transferValidation.accountNumber,
        sendingAcct: Number(currentAccount.accountNumber),
        sendingAcctName: currentCustomer.fullName,
        rrn: transferValidation.routingNumber,
        description: transferValidation.description
      }

      const sendTransaction = await axios.default.post(localTransferURL, paymentData, {headers:headers});

      if (sendTransaction.status !== 200) {
        return res.status(400).send({success: false, message: 'transfer failed'});
      }

      const generateTrxnId = generateTransactionId();

      await currentAccount.createLocal_transfer({
        entry: TRANSACTION_TYPE.debit,
        description: transferValidation.description,
        amount: transactionAmount,
        bankName: transferValidation.bankName,
        accountNumber: transferValidation.accountNumber,
        routingNumber: transferValidation.routingNumber,
        accountName: transferValidation.accountName,
        status: 'completed',
        trxnId: generateTrxnId
      },{transaction});

      await currentAccount.createTransaction({
        entry: TRANSACTION_TYPE.debit,
        transactionType: LOCAL,
        description: transferValidation.description,
        amount: transactionAmount,
        balance: getSenderNewBalance.newAvailableBalance,
        trxnId: generateTrxnId,
        charge: 0
      }, {transaction})
      
      await Accounts.update({
        availableBalance: getSenderNewBalance.newAvailableBalance,
        currentBalance: getSenderNewBalance.newCurrentBalance
      }, {
        where: {
          id: currentAccount.id
        }
      },{transaction})

      await transaction.commit();

      return res.status(200).send({success: true, message: 'transfer sent'});
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }
)

router.post('/local/domestic-wire', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await domesticWireTransferSchema.validate(req.body);

  if (transferValidation.transferType === TRANSFER_TYPE.domesticWire) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const totalTransactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, totalTransactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const bankInfo = await validateRoutingNumber(transferValidation.routingNumber)
      
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: bankInfo.customer_name,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          debit: transferValidation.amount,
          address: `${transferValidation.address}, \n ${transferValidation.city}, ${transferValidation.state}, \n ${transferValidation.zipCode}`,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'processing'
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})

router.post('/local/billpay', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await billpayTransferSchema.validate(req.body);
  // NEFT (National Electronic Fund Transfer)
  if (transferValidation.transferType === TRANSFER_TYPE.billpay) {
    let d = new Date(transferValidation.schedule);
    d.setUTCHours(0,0,0,0);
    const transferSchedule = d.toISOString();
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, transactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const bankInfo = await validateRoutingNumber(transferValidation.routingNumber)

      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: bankInfo.customer_name,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          debit: transferValidation.amount,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'pending',
          schedule: transferSchedule
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})

router.post('/international/international-wire', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await internationalWireTransferSchema.validate(req.body);

  if (transferValidation.transferType === TRANSFER_TYPE.internationalWire) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, transactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: transferValidation.bankName,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          swiftCode: transferValidation.swiftOrIban,
          debit: transferValidation.amount,
          address: `${transferValidation.address}, \n ${transferValidation.city}, ${transferValidation.state}, \n ${transferValidation.zipCode}`,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'Processing'
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})


module.exports = router;