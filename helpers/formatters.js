const formatCustomerDOB = (dob) => {
    let getDate = new Date(dob);
    getDate.setUTCHours(0,0,0,0);
    const formatedDOB = getDate.toISOString();
    return formatedDOB;
}

const formatDollarToCent = (amount) => {
    return amount * 100;
}

const generateTransactionId = () => {
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, ''); // Remove separators for a compact timestamp
    const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // Add random part padded to 6 digits
  
    // You can customize this part based on your requirements
    const transactionId = `TXN-${timestamp}-${randomPart}`;
  
    return transactionId;
}

module.exports = {formatCustomerDOB, formatDollarToCent, generateTransactionId}