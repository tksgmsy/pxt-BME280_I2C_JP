BME280_I2C.Init(BME280_I2C_ADDRESS.e_0x76)
if (BME280_I2C.DeviceFound()) {
    basic.showIcon(IconNames.Heart)
} else {
    basic.showIcon(IconNames.Sad)
}
basic.forever(() => {
    basic.showString("T:")
    basic.showNumber(BME280_I2C.Temperature())
    basic.showString(" P:")
    basic.showNumber(BME280_I2C.Pressure())
    basic.showString(" H:")
    basic.showNumber(BME280_I2C.Humidity())
})
