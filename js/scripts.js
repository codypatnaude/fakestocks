/*
 *This is for functions that don't really belong in the model
 */

function toUSCurrency(num){
  return parseFloat(num).toLocaleString("en-US", {style: "currency", currency: "USD", minimumFractionDigits: 2})
}
