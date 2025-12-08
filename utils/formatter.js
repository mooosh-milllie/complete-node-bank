export const currencyFormatter = (amount) => {

    const centToUSD = amount / 100;

    let toUSDFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return toUSDFormat.format(centToUSD);
}