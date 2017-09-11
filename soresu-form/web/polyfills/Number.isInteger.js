if (typeof Number.isInteger !== "function") {
  Number.isInteger = function (number) {
    return (typeof number === "number") && (number - Math.floor(number) === 0)
  }
}
