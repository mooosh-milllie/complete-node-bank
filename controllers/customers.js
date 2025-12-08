const router = require('express').Router();
const bycrypt = require('bcrypt');
const {Customers, AccountHistory, PendingTransactions, Accounts, Transactions, Login} = require('../models/index');
const {changePasswordSchema, updateProfilePicture} = require('../helpers/formValidator');
const { cloudinary } = require('../utils/cloudinary');

const CONFIG = require('../utils/config');


router.get('/home', async(req, res, next) => {
  const id = req.refId;
  try {
    let currentCustomer = await Customers.findOne({where:{id: id},
      include: [
        { 
          model: Accounts,
          include: [{
            model: Transactions,
            separate: true,
            order: [['created_at', 'DESC']],
            limit: 3
          }],
          attributes: ["id","accountNumber", "accountStatus", "accountType", "availableBalance", "currentBalance"]
        }
      ],
      attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'fullName']
    });

    const customerId = currentCustomer.id;

    const totalCount = await Transactions.count({
      include: [{
        model: Accounts,
        where: { customerId }
      }]
    });
    
    const customerPlain = currentCustomer.get({ plain: true });

    customerPlain.transCount = totalCount;

    res.status(200).send(customerPlain);
  } catch (error) {
    next(error);
  }
})

router.get('/account-history', async(req, res, next) => {
  const id = req.refId;

  const page = parseInt(req.query.page) || 1;   // current page (1-based)
  const pageSize = parseInt(req.query.pageSize) || 5; // items per page
  console.log("PAGE", req.query)

  const offset = (page - 1) * pageSize;

  try {
    const currentAccount = await Accounts.findOne({
      where: { customer_id: id },
      include: [{
        model: Transactions,
        separate: true,
        limit: pageSize,
        offset: offset,
        order: [['created_at', 'DESC']],
      }],
      attributes: {
        exclude: ['pin', 'createdAt', 'updatedAt']
      }
    });

    // console.log(currentAccount);
    // const currentCustomer = await Accounts.findOne({where:{customer_id: id},
    //   include: [Transactions],
    //   attributes: {
    //   exclude: ['identityCard', 'createdAt', 'updatedAt']
    //   }
    // })

    // const accountHistory = await currentCustomer.get('transactions');

    const totalCount = await Transactions.count({
      where: { accountId: currentAccount.id }
    });

    res.json({
      account: currentAccount.get("transactions",{ plain: true }),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page < Math.ceil(totalCount / pageSize),
        hasPrev: page > 1
      }
    });
    return
  } catch (error) {
    next(error);
  }
})

router.get('/pending-account-history', async(req, res, next) => {
  const id = req.refId;

  try {

    const accountHistory = await PendingTransactions.findAll({
      where: {
        customerId: id
      },
      attributes: ['id', 'credit', 'debit', 'description', 'transactionStatus']
    });
    return res.status(200).send(accountHistory);
  } catch (error) {
    next(error);
  }
})

router.get('/profile', async(req, res, next) => {
  const id = req.refId;
  try {
    const {fullName, address, city, state, gender, title, maritalStatus, profilePicture} = await Customers.findOne({where:{id: id},
      attributes: {
      exclude: ['identityCard', 'createdAt', 'updatedAt']
    }});

    res.status(200).send({success: true, data: {
      fullName,
      address,
      city,
      state,
      gender,
      title,
      maritalStatus,
      profilePicture
    }});
  } catch (error) {
    next(error);
  }
})

router.put('/change-password', async(req, res, next) => {
  const id = req.refId;

  try {
    const validatedPassword = await changePasswordSchema.validate(req.body);
    const currentCustomerLogin = await Login.findOne({where: {customer_id: id}});
    if (!currentCustomerLogin) {
      return res.status(401).send({success: false, message: 'password update failed'});
    }
    const passwordCorrect = await bycrypt.compare(validatedPassword.oldPassword, currentCustomerLogin.password);

    if (!passwordCorrect) {
      return res.status(401).send({success: false, message: 'incorrect password'});
    }

    const hashedPassword = await bycrypt.hash(validatedPassword.newPassword, CONFIG.BCRYPT_SALT);
    
    await currentCustomerLogin.update({password: hashedPassword})

    return res.status(200).send({success: true, message: 'password updated'});
  } catch (error) {
    next(error);
  }
})

router.put('/update-profile-picture', async(req, res, next) => {
  const id = req.refId;
  const validationResult = await updateProfilePicture.validate(req.body.profilePicture);
  const PROFILE_PIC = validationResult.profilePicture;

  try {
    const imageUrl = await cloudinary.uploader.upload(PROFILE_PIC.avatar, 
    { width: 250, height: 250, crop: "fill" });

    const currentCustomer = await Customers.update({profilePicture: imageUrl.secure_url}, {
      where: {
        id: id,
      }
    });
    if (currentCustomer) {
      return res.status(200).send({success: true, message: 'IMAGE UPLOADED'});
    }
  } catch (error) {
    next(error);
  }
})



module.exports = router;