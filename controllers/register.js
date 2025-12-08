const router = require('express').Router();
const {registerationSchema} = require('../helpers/formValidator');
const  CONFIG = require('../utils/config');
const {Customers, Accounts} = require('../models/index');
const { cloudinary } = require('../utils/cloudinary');
const { mailOptions, transporter } = require('../utils/emailHelpers');
const { Op } = require('sequelize');
const sequelize = require('../utils/db');
const { formatCustomerDOB } = require('../helpers/formatters');


router.post('/',  async (req, res, next) => {
  
  try {
    let validationResult = await registerationSchema.validate(req.body, {abortEarly: false});
    const formatedDOB = formatCustomerDOB(validationResult.dob);
    const checkExisting = Customers.findOne({
      where: {
        [Op.or]: [{email: validationResult.email}, {phoneNumber: validationResult.phoneNumber}, {socialSecurity: validationResult.socialSecurity}]
      }
    })
    if (checkExisting) {
      if (checkExisting.email === validationResult.email && checkExisting.phone === validationResult.phoneNumber && checkExisting.socialSecurity === validationResult.socialSecurity) {
        return res.status(400).send({success: false, message: 'ACCOUNT ALREADY EXISTS'})
      }
      if (checkExisting.email === validationResult.email && checkExisting.phone === validationResult.phoneNumber) {
        return res.status(400).send({success: false, message: 'EMAIL AND PHONE ALREADY EXISTS'})
      }
      if (checkExisting.email === validationResult.email) {
        return res.status(400).send({success: false, message: 'EMAIL ALREADY EXISTS'})
      }
      if (checkExisting.phone === validationResult.phoneNumber) {
        return res.status(400).send({success: false, message: 'PHONE NUMBER ALREADY EXISTS'})
      }
      if (checkExisting.socialSecurity === validationResult.socialSecurity) {
        return res.status(400).send({success: false, message: 'ACCOUNT ALREADY EXISTS'})
      }
    }
    const ID_CARD = validationResult.identityCard.idCard;

    // const imageUrl = 'https://res.cloudinary.com/lordflames/image/upload/v1654516454/blank-profile-picture_dg8szo.png'
    const imageUrl = await cloudinary.uploader.upload(ID_CARD, 
    { width: 400, height: 300, crop: "fill" });
    
    
    // // While loop to handle registeration of of new customers, until the account number generated is unique
    let accountNumberGenerator;
    while (true) {
      // Generate account Number of 10 digts
      accountNumberGenerator = Math.floor(2000000000 + Math.random() * 9000000000);
      const existingCustomer = await Accounts.findOne({
        where:{ accountNumber: accountNumberGenerator}
      })
      
      if (existingCustomer === null) {
        break
      }
    }
    // If a user does not exist with the unique details provided, a the customer is created
    let transaction;
    try {
      transaction = await sequelize.transaction();

      const {firstName, lastName, middleName, email, address, city, state, socialSecurity, gender, maritalStatus, branch, phoneNumber, occupation, employer} = validationResult;

      const newCustomer = await Customers.create({
        firstName, middleName, lastName, email, address, city, state, socialSecurity, gender, maritalStatus, occupation, branch, employer, phoneNumber, dob: formatedDOB, identityCard: imageUrl.secure_url
      }, {transaction});

     const newAccount = await Accounts.create({
        accountNumber: accountNumberGenerator,
        accountType: validationResult.accountType,
        customer_id: newCustomer.id
      }, {transaction});

      await transaction.commit();
      
      
      let emailSubject = 'Welcome to Node Bank';
      let emailBody = `
      <h1>Welcome to NodeBank</h1>
      <p> Your Account registration was successful, \n your account number is ${accountNumberGenerator} and pin is ${newAccount.pin}</p>
      <p>Visit http://localhost:3000/enrollment to enroll for online banking, and bank on the go.</p>`;
      let emailReceiver = newCustomer.email;
      await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'html')});
      
    } catch (error) {
      await transaction.rollback();
      next(error)
    }
    
    return res.status(200).send({success: true, message: 'ACCOUNT CREATED'});
  } catch (error) {
    console.log(error)
    return next(error)
  }
})

module.exports = router;