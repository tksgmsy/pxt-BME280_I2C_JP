
enum BME280_I2C_ADDRESS {
    //% block="0x76"
    e_0x76 = 0x76,
    //% block="0x77"
    e_0x77 = 0x77
};

enum BME280_I2C_SENSOR_MODE {
    //% block="スリープ"
    e_SLEEP = 0x00,
    //% block="強制(一回だけ計測)"
    e_FORCED = 0x01,
    //% block="通常（ずっと計測）"
    e_NORMAL = 0x03
};

enum BME280_I2C_SAMPLING_MODE {
    //% block="スキップ"
    e_SKIP = 0x00,
    //% block="1X"
    e_1X = 0x01,
    //% block="2X"
    e_2X = 0x02,
    //% block="4X"
    e_4X = 0x03,
    //% block="8X"
    e_8X = 0x04,
    //% block="16X"
    e_16X = 0x05
};

enum BME280_I2C_STANDBY_DURATION {
    //% block="1ms"
    e_1_MS = 0x01,
    //% block="10ms"
    e_10_MS = 0x06,
    //% block="20ms"
    e_20_MS = 0x07,
    //% block="62ms"
    e_62_5_MS = 0x01,
    //% block="125ms"
    e_125_MS = 0x02,
    //% block="250ms"
    e_250_MS = 0x03,
    //% block="500ms"
    e_500_MS = 0x04,
    //% block="1000ms"
    e_1000_MS = 0x05
};

enum BME280_I2C_IIR_FILTER_COEFFICIENT {
    //% block="OFF"
    e_OFF = 0x00,
    //% block="2"
    e_2 = 0x01,
    //% block="4"
    e_4 = 0x02,
    //% block="8"
    e_8 = 0x03,
    //% block="16"
    e_16 = 0x04
};

//% color="#03DEAD" icon="\uf2c9" block="BME280_I2C"
namespace BME280_I2C {

    let serialDebugOut: boolean = false;

    function DebugWriteLine(str: string): void {
        if (serialDebugOut)
            serial.writeLine("BME280I2C: " + str + "\r\n");
    }

    let I2CAddr = BME280_I2C_ADDRESS.e_0x76;

    function I2CWriteByte(register: number, data: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = register;
        buf[1] = data;
        pins.i2cWriteBuffer(I2CAddr, buf, false);
    }

    function I2CRead(adress: number, len: number): Buffer {
        pins.i2cWriteNumber(I2CAddr, adress, NumberFormat.UInt8BE, true);
        return pins.i2cReadBuffer(I2CAddr, len, false);
    }

    function I2CReadUint8(adress: number): number {
        pins.i2cWriteNumber(I2CAddr, adress, NumberFormat.UInt8BE, true);
        let buf = pins.i2cReadBuffer(I2CAddr, 1, false);

        return (buf.getNumber(NumberFormat.UInt8BE, 0));
    }

    function I2CReadInt8(adress: number): number {
        pins.i2cWriteNumber(I2CAddr, adress, NumberFormat.UInt8BE, true);
        let buf = pins.i2cReadBuffer(I2CAddr, 1, false);

        return (buf.getNumber(NumberFormat.Int8BE, 0));
    }

    let deviceFound: boolean = false;
    let currentMode: BME280_I2C_SENSOR_MODE = BME280_I2C_SENSOR_MODE.e_SLEEP;
    let lastSensorDataTime: number = 0;

    let dig_T1: number = 0;
    let dig_T2: number = 0;
    let dig_T3: number = 0;
    let dig_P1: number = 0;
    let dig_P2: number = 0;
    let dig_P3: number = 0;
    let dig_P4: number = 0;
    let dig_P5: number = 0;
    let dig_P6: number = 0;
    let dig_P7: number = 0;
    let dig_P8: number = 0;
    let dig_P9: number = 0;

    let dig_H1: number = 0;
    let dig_H2: number = 0;
    let dig_H3: number = 0;
    let dig_H4: number = 0;
    let dig_H5: number = 0;
    let dig_H6: number = 0;

    interface Settings {
        osr_p: number;
        osr_t: number;
        osr_h: number;
        filter: number;
        standby_time: number;
    }

    let currentSettings: Settings = { osr_p: 0, osr_t: 0, osr_h: 0, filter: 0, standby_time: 0 };
    let currentSettingsIsChanged: boolean = false;

    interface MesurementData {
        pressure: number;
        temperature: number;
        humidity: number;
    };
    let currentUncompensatedData: MesurementData = { pressure: 0, temperature: 0, humidity: 0 };
    let currentCompensatedData: MesurementData = { pressure: 0, temperature: 0, humidity: 0 };
    let current_t_fine: number = 0;

    function GetCalibrationData(): void {
        DebugWriteLine("GetCalibrationData");
        let BME280_TEMP_PRESS_CALIB_DATA_ADDR = 0x88;
        let BME280_TEMP_PRESS_CALIB_DATA_LEN = 26;

        let BME280_HUMIDITY_CALIB_DATA_ADDR: number = 0xE1;
        let BME280_HUMIDITY_CALIB_DATA_LEN: number = 7;

        let buf = I2CRead(BME280_TEMP_PRESS_CALIB_DATA_ADDR, BME280_TEMP_PRESS_CALIB_DATA_LEN);

        dig_T1 = buf.getNumber(NumberFormat.UInt16LE, 0);
        dig_T2 = buf.getNumber(NumberFormat.Int16LE, 2);
        dig_T3 = buf.getNumber(NumberFormat.Int16LE, 4);

        dig_P1 = buf.getNumber(NumberFormat.UInt16LE, 6);
        dig_P2 = buf.getNumber(NumberFormat.Int16LE, 8);
        dig_P3 = buf.getNumber(NumberFormat.Int16LE, 10);
        dig_P4 = buf.getNumber(NumberFormat.Int16LE, 12);
        dig_P5 = buf.getNumber(NumberFormat.Int16LE, 14);
        dig_P6 = buf.getNumber(NumberFormat.Int16LE, 16);
        dig_P7 = buf.getNumber(NumberFormat.Int16LE, 18);
        dig_P8 = buf.getNumber(NumberFormat.Int16LE, 20);
        dig_P9 = buf.getNumber(NumberFormat.Int16LE, 22);

        dig_H1 = buf.getNumber(NumberFormat.UInt8BE, 25);

        buf = I2CRead(BME280_HUMIDITY_CALIB_DATA_ADDR, BME280_HUMIDITY_CALIB_DATA_LEN);

        dig_H2 = buf.getNumber(NumberFormat.Int16LE, 0);
        dig_H3 = buf.getNumber(NumberFormat.UInt8BE, 2);

        let E4 = buf.getNumber(NumberFormat.Int8BE, 3);
        let E5 = buf.getNumber(NumberFormat.UInt8BE, 4);
        let E6 = buf.getNumber(NumberFormat.Int8BE, 5);
        dig_H4 = E4 << 4 | (E5 & 0x0F)
        dig_H5 = E6 << 4 | (E5 >> 4)

        dig_H6 = buf.getNumber(NumberFormat.Int8BE, 6);
        DebugWriteLine("GetCalibrationData - Finished");
    }

    // notice that current setting params will be invalidated after resetting.
    function SoftReset(): void {
        DebugWriteLine("SoftReset");
        let BME280_RESET_ADDR = 0xE0;

        /* 0xB6 is the soft reset command */
        let soft_rst_cmd = 0xB6;

        I2CWriteByte(BME280_RESET_ADDR, soft_rst_cmd);

        // initial mode is Sleep.
        currentMode = BME280_I2C_SENSOR_MODE.e_SLEEP;

        // wait for device boot
        basic.pause(3);
        DebugWriteLine("SoftReset - Finished");
    }

    function ReadSettings(): Settings {
        DebugWriteLine("ReadSettings");
        let BME280_CTRL_HUM_ADDR = 0xF2;
        let ret: Settings = { osr_p: 0, osr_t: 0, osr_h: 0, filter: 0, standby_time: 0 };

        let buf = I2CRead(BME280_CTRL_HUM_ADDR, 4);

        let F2 = buf.getNumber(NumberFormat.UInt8BE, 0);
        let F4 = buf.getNumber(NumberFormat.UInt8BE, 2);
        let F5 = buf.getNumber(NumberFormat.UInt8BE, 3);

        ret.osr_h = F2 & 0x07;
        ret.osr_p = (F4 & 0x1C) >> 2;
        ret.osr_t = (F4 & 0xE0) >> 5;
        ret.filter = (F5 & 0x1C) >> 2;
        ret.standby_time = (F5 & 0xE0) >> 5;

        DebugWriteLine("ReadSettings - Finished");
        return ret;
    }

    function WriteSettings(settings: Settings): void {
        DebugWriteLine("WriteSettings");
        let BME280_CTRL_HUM_ADDR = 0xF2;
        let BME280_CTRL_MEAS_ADDR = 0xF4;
        let BME280_CONFIG_ADDR = 0xF5;

        let buf = I2CRead(BME280_CTRL_HUM_ADDR, 4);

        let F2 = buf.getNumber(NumberFormat.UInt8BE, 0);
        let F4 = buf.getNumber(NumberFormat.UInt8BE, 2);
        let F5 = buf.getNumber(NumberFormat.UInt8BE, 3);

        F2 = (F2 & 0xF8) | (settings.osr_h & 0x07);
        F4 = (F4 & 0xE3) | ((settings.osr_p << 2) & 0x1C);
        F4 = (F4 & 0x1F) | ((settings.osr_t << 5) & 0xE0);
        F5 = (F5 & 0xE3) | ((settings.filter << 2) & 0x1C);
        F5 = (F5 & 0x1F) | ((settings.standby_time << 5) & 0xE0);

        I2CWriteByte(BME280_CTRL_HUM_ADDR, F2);
        I2CWriteByte(BME280_CTRL_MEAS_ADDR, F4);
        I2CWriteByte(BME280_CONFIG_ADDR, F5);

        DebugWriteLine("WriteSettings - Finished");
    }

    function compensate_temperature(): void {
        let var1: number;
        let var2: number;
        let temperature: number;
        let temperature_min: number = -4000;
        let temperature_max: number = 8500;

        var1 = (currentUncompensatedData.temperature / 8) - (dig_T1 * 2);
        var1 = (var1 * dig_T2) / 2048;
        var2 = (currentUncompensatedData.temperature / 16) - dig_T1;
        var2 = (((var2 * var2) / 4096) * dig_T3) / 16384;

        current_t_fine = var1 + var2;
        temperature = ((current_t_fine) * 5 + 128) / 256;

        if (temperature < temperature_min)
            temperature = temperature_min;
        else if (temperature > temperature_max)
            temperature = temperature_max;

        currentCompensatedData.temperature = temperature;
    }

    function compensate_pressure(): void {
        let var1: number;
        let var2: number;
        let var3: number;
        let var4: number;
        let var5: number;
        let pressure: number;
        let pressure_min: number = 30000;
        let pressure_max: number = 110000;

        var1 = (current_t_fine / 2) - 64000;
        var2 = (((var1 / 4) * (var1 / 4)) / 2048) * dig_P6;
        var2 = var2 + ((var1 * dig_P5) * 2);
        var2 = (var2 / 4) + (dig_P4 * 65536);
        var3 = (dig_P3 * (((var1 / 4) * (var1 / 4)) / 8192)) / 8;
        var4 = (dig_P2 * var1) / 2;
        var1 = (var3 + var4) / 262144;
        var1 = ((32768 + var1) * dig_P1) / 32768;

        // avoid zero div.
        if (var1 != 0) {
            var5 = 1048576 - currentUncompensatedData.pressure;
            pressure = (var5 - (var2 / 4096));

            if (pressure > 85343)
                pressure = ((pressure * 3125) / var1) * 2;
            else
                pressure = ((pressure * 3125) << 1) / var1;

            var1 = (dig_P9 * (((pressure / 8) * (pressure / 8)) / 8192)) / 4096;
            var2 = ((pressure / 4) * dig_P8) / 8192;
            pressure = pressure + (var1 + var2 + dig_P7) / 16;

            if (pressure < pressure_min)
                pressure = pressure_min;
            else if (pressure > pressure_max)
                pressure = pressure_max;
        } else {
            pressure = pressure_min;
        }

        currentCompensatedData.pressure = pressure;
    }

    function compensate_humidity(): void {
        let var1: number;
        let var2: number;
        let var3: number;
        let var4: number;
        let var5: number;
        let var6: number;
        let humidity: number;

        var1 = current_t_fine - 76800;
        var2 = currentUncompensatedData.humidity * 16384;
        var3 = dig_H4 * 1048576;
        var4 = dig_H5 * var1;
        var5 = (((var2 - var3) - var4) + 16384) / 32768;
        var2 = (var1 * dig_H6) / 1024;
        var3 = (var1 * dig_H3) / 2048;
        var4 = ((var2 * (var3 + 32768)) / 1024) + 2097152;
        var2 = ((var4 * dig_H2) + 8192) / 16384;
        var3 = var5 * var2;
        var4 = ((var3 / 32768) * (var3 / 32768)) / 128;
        var5 = var3 - ((var4 * dig_H1) / 16);
        var5 = Math.max(var5, 0);
        var5 = Math.min(var5, 419430400);
        humidity = var5 / 4096;

        currentCompensatedData.humidity = humidity;
    }


    function UpdateCompensatedData(): void {
        DebugWriteLine("UpdateCompensatedData");
        compensate_temperature();
        compensate_pressure();
        compensate_humidity();
        DebugWriteLine("UpdateCompensatedData - Finish");
    }

    function IsUpdateNeeded(): boolean {
        if (currentMode != BME280_I2C_SENSOR_MODE.e_NORMAL) {
            return false;
        }

        let currentTime = input.runningTime();
        if (lastSensorDataTime == 0 ||
            lastSensorDataTime > currentTime)
            return true;

        let ETA: number = 10;
        switch (currentSettings.standby_time) {
            case BME280_I2C_STANDBY_DURATION.e_1_MS:
                ETA += 1;
                break;
            case BME280_I2C_STANDBY_DURATION.e_10_MS:
                ETA += 10;
                break;
            case BME280_I2C_STANDBY_DURATION.e_20_MS:
                ETA += 20
                break;
            case BME280_I2C_STANDBY_DURATION.e_62_5_MS:
                ETA += 62;
                break;
            case BME280_I2C_STANDBY_DURATION.e_125_MS:
                ETA += 125;
                break;
            case BME280_I2C_STANDBY_DURATION.e_250_MS:
                ETA += 250;
                break;
            case BME280_I2C_STANDBY_DURATION.e_500_MS:
                ETA += 250;
                break;
            case BME280_I2C_STANDBY_DURATION.e_1000_MS:
                ETA += 1000;
                break;
            default:
                break;
        }

        if (lastSensorDataTime + ETA < currentTime)
            return true;

        return false;
    }

    function ReadSensorData(): void {
        DebugWriteLine("ReadSensorData");
        let BME280_DATA_ADDR = 0xF7;
        let BME280_P_T_H_DATA_LEN = 8;

        let buf = I2CRead(BME280_DATA_ADDR, BME280_P_T_H_DATA_LEN);

        let data_xlsb: number;
        let data_lsb: number;
        let data_msb: number;

        data_msb = buf.getNumber(NumberFormat.UInt8BE, 0) << 12;
        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 1) << 4;
        data_xlsb = buf.getNumber(NumberFormat.UInt8BE, 2) >> 4;
        currentUncompensatedData.pressure = data_msb | data_lsb | data_xlsb;

        data_msb = buf.getNumber(NumberFormat.UInt8BE, 3) << 12;
        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 4) << 4;
        data_xlsb = buf.getNumber(NumberFormat.UInt8BE, 5) >> 4;
        currentUncompensatedData.temperature = data_msb | data_lsb | data_xlsb;

        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 6) << 8;
        data_msb = buf.getNumber(NumberFormat.UInt8BE, 7);
        currentUncompensatedData.humidity = data_msb | data_lsb;

        UpdateCompensatedData();

        lastSensorDataTime = input.runningTime();

        DebugWriteLine("ReadSensorData - Finished");
    }

    function PutDeviceToSleep(): void {
        DebugWriteLine("PutDeviceToSleep");

        SoftReset();

        WriteSettings(currentSettings);
        currentSettingsIsChanged = true;
        DebugWriteLine("PutDeviceToSleep - Finished");
    }

    /** サンプリングモードの設定
    * 計測するときのオーバーサンプリングの回数を設定。高いサンプル数は精密な計測につながります。ただし消費電力は増えます。
    * スキップを選択すると、その項目は測定しません。ただし、温度の計測結果は、圧力と、湿度のデータの補正に使われますので、温度は切らないことをお勧めします。
    * @param t 温度のサンプリングモード, eg:BME280_I2C_SAMPLING_MODE.e_2X
    * @param p 気圧のサンプリングモード, eg:BME280_I2C_SAMPLING_MODE.e_16X
    * @param h 湿度のサンプリングモード, eg:BME280_I2C_SAMPLING_MODE.e_1X
    */
    //% weight=28
    //% blockId=BME280_I2C_SetSamplingMode
    //% block="BME280|サンプリングモード 温度: %t| 気圧: %p| 湿度: %h"
    export function SetSamplingMode(
        t: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_2X,
        p: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_16X,
        h: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_1X): void {
        DebugWriteLine("SetSamplingMode");

        currentSettings.osr_t = t;
        currentSettings.osr_p = p;
        currentSettings.osr_h = h;
        currentSettingsIsChanged = true;

        DebugWriteLine("SetSamplingMode - Finished");
    }

    /** スタンバイ時間間隔の設定。ノーマルモードの時の計測終了から次の計測までの時間を設定します。
     * @param sb 間隔, eg: BME280_I2C_STANDBY_DURATION.e_500_MS
     */
    //% weight=29
    //% blockId=BME280_I2C_SetStandbyDuration block="BME280 スタンバイ時間間隔: %sb"
    export function SetStandbyDuration(sb: BME280_I2C_STANDBY_DURATION = BME280_I2C_STANDBY_DURATION.e_500_MS): void {
        DebugWriteLine("SetStandbyDuration");

        currentSettings.standby_time = sb;
        currentSettingsIsChanged = true;

        DebugWriteLine("SetStandbyDuration - Finished");
    }

    /** IIR フィルタ係数の設定。ノーマルモードの時のみ有効になります。
     * @param 設定するフィルタ係数, eg: BME280_I2C_IIR_FILTER_COEFFICIENT.e_16
     */
    //% weight=27
    //% blockId=BME280_I2C_IIRFilterCoefficient block="BME280 IIRフィルタ係数: %coef"
    export function SetIIRFilterCoefficient(coef: BME280_I2C_IIR_FILTER_COEFFICIENT = BME280_I2C_IIR_FILTER_COEFFICIENT.e_16): void {
        DebugWriteLine("SetIIRFilterCoefficient");

        currentSettings.filter = coef;
        currentSettingsIsChanged = true;

        DebugWriteLine("SetIIRFilterCoefficient - Finished");
    }

    /** 設定の更新の実行。サンプリングモードや、スタンバイ時間間隔、IIRフィルタなどの設定は、値を設定してから、
     * このブロックを実行すると、実際にBME280の設定を変更します。
     */
    //% weight=26
    //% blockId=BME280_I2C_UpdateSettings block="BME280 設定の更新実行"
    export function UpdateSettings(): void {
        DebugWriteLine("UpdateSettings");

        if (currentSettingsIsChanged) {
            WriteSettings(currentSettings);
            currentSettingsIsChanged = false;
            lastSensorDataTime = 0;
        }

        DebugWriteLine("UpdateSettings - Finished");
    }

    /** センサーモードの設定
     * ノーマルモードでは、センサーの計測を一定時間間隔で連続して行います。 
     * 強制モードでは、直ちに一回だけ計測を行います。終わったらスリープモードに移行します。 
     * スリープモード。何も計測しません。ただし、BME280は最後に計測したデータを保持していますので、その値は読み出すことが出来ます。
     * @param 設定するセンサーモード, eg: BME280_I2C_SENSOR_MODE.e_NORMAL
     */
    //% weight=25
    //% blockId=BME280_I2C_SetSensorMode
    //% block="BME280 センサーモードの設定 %mode"
    export function SetSensorMode(mode: BME280_I2C_SENSOR_MODE = BME280_I2C_SENSOR_MODE.e_NORMAL): void {
        DebugWriteLine("SetSensorMode");
        let BME280_PWR_CTRL_ADDR = 0xF4;

        // update osr, IIR filter, standby duration settings if those are changed.
        UpdateSettings();

        let currentReg = I2CReadUint8(BME280_PWR_CTRL_ADDR);

        if ((currentReg & 0x03) != BME280_I2C_SENSOR_MODE.e_SLEEP) {
            PutDeviceToSleep();
        }
        if (mode != BME280_I2C_SENSOR_MODE.e_SLEEP) {
            currentReg = currentReg & 0xFC | mode;
            I2CWriteByte(BME280_PWR_CTRL_ADDR, currentReg);
            currentMode = mode;
            lastSensorDataTime = 0;
        }

        if (mode == BME280_I2C_SENSOR_MODE.e_FORCED) {
            let wcnt = 0;
            // wait for finishing mesurement.
            basic.pause(10); // at least it will take more than 10ms    
            for (; ;) {
                currentReg = I2CReadUint8(BME280_PWR_CTRL_ADDR);
                if ((currentReg & 0x03) == BME280_I2C_SENSOR_MODE.e_SLEEP)
                    break;
                basic.pause(1);
                wcnt++;
            }
            if (wcnt > 0)
                DebugWriteLine("wcnt = " + wcnt + "\r\n");
            currentMode = BME280_I2C_SENSOR_MODE.e_SLEEP;
            ReadSensorData();
        }

        DebugWriteLine("SetSensorMode - Finished");
    }

    /** 初期化。BME280を使う時は、必ず、最初に、一回だけ実行してください。
     * I2CバスにBME280が見つかり、無事に初期化できた場合は、"デバイスが見つかった"ブロックは真を返すようになります。
     * @param BME280のI2Cバスのアドレス, eg: BME280_I2C_ADDRESS.e_0x76
     */
    //% weight=90
    //% blockId=BME280_I2C_Init
    //% block="BME280 初期化　I2Cアドレス = %i2cAddr"
    export function Init(
        i2cAddr: BME280_I2C_ADDRESS = BME280_I2C_ADDRESS.e_0x76): void {
        DebugWriteLine("Init");
        let BME280_CHIP_ID = 0x60;
        let BME280_CHIP_ID_ADDR = 0xD0;

        I2CAddr = i2cAddr;

        deviceFound = false;
        currentMode = BME280_I2C_SENSOR_MODE.e_SLEEP;

        let try_count = 5;

        while (try_count > 0) {
            let chip_id = I2CReadUint8(BME280_CHIP_ID_ADDR);

            if (chip_id != BME280_CHIP_ID) {
                basic.pause(10);
                --try_count;
                DebugWriteLine("Device Not Found... retrying");
                continue;
            }

            DebugWriteLine("Device Found");
            deviceFound = true;

            // reset the sensor once
            SoftReset();

            // read calibration regs.
            GetCalibrationData();

            // read current setting params.
            currentSettings = ReadSettings();
            currentSettingsIsChanged = false;

            // Set stats to default state.
            SetSamplingMode();
            SetStandbyDuration();
            SetIIRFilterCoefficient();
            UpdateSettings();
            SetSensorMode();

            break;
        };

        DebugWriteLine("Init - Finished");
    };

    /** 初期化を実行して、正しくBME280が初期化できた場合は、真を返します。そうでなければ偽を返します。
     */
    //% weight=89
    //% blockId=BME280_I2C_DeviceFound block="BME280 デバイスが見つかったか"
    export function DeviceFound(): boolean {
        DebugWriteLine("DeviceFound");
        return deviceFound;
    }

    //% weight=87
    //% blockId=BME280_I2C_temperature block="BME280 気温(℃)"
    export function Temperature(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return (currentCompensatedData.temperature + 50) / 100;
    }

    //% weight=86
    //% blockId=BME280_I2C_pressure block="BME280 気圧(hPa)"
    export function Pressure(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return (currentCompensatedData.pressure + 50) / 100;
    }

    //% weight=85
    //% blockId=BME280_I2C_humidity block="BME280 湿度(%)"
    export function Humidity(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return (currentCompensatedData.humidity + 512) / 1024;
    }

    //% weight=84
    //% blockId=BME280_I2C_temperature100 block="BME280 気温(100倍)"
    export function Temperature100(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return currentCompensatedData.temperature;
    }

    //% weight=83
    //% blockId=BME280_I2C_pressure100 block="BME280 気圧(100倍)"
    export function Pressure100(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return currentCompensatedData.pressure;
    }

    //% weight=82
    //% blockId=BME280_I2C_humidity100 block="BME280 湿度(100倍)"
    export function Humidity100(): number {
        if (IsUpdateNeeded())
            ReadSensorData();

        return (currentCompensatedData.humidity * 100) / 1024;
    }

    function DumpCurrentState(): string {
        let retStr: string = "";

        retStr += "Device Found : " + deviceFound + "\r\n";
        retStr += "Curent Mode : " + currentMode + "\r\n";

        retStr += "Curent Settings:\r\n";
        retStr += "osr_p: " + currentSettings.osr_p + "\r\n";
        retStr += "osr_t: " + currentSettings.osr_t + "\r\n";
        retStr += "osr_h: " + currentSettings.osr_h + "\r\n";
        retStr += "filter: " + currentSettings.filter + "\r\n";
        retStr += "standby_time: " + currentSettings.standby_time + "\r\n";

        return retStr;
    }

    function DumpCalibrationData(): string {
        let retStr: string = "";

        retStr += "Calibration Data\r\n";
        retStr += "dig_T1: " + dig_T1 + "\r\n";
        retStr += "dig_T2: " + dig_T2 + "\r\n";
        retStr += "dig_T3: " + dig_T3 + "\r\n";

        retStr += "dig_P1: " + dig_P1 + "\r\n";
        retStr += "dig_P2: " + dig_P2 + "\r\n";
        retStr += "dig_P3: " + dig_P3 + "\r\n";
        retStr += "dig_P4: " + dig_P4 + "\r\n";
        retStr += "dig_P5: " + dig_P5 + "\r\n";
        retStr += "dig_P6: " + dig_P6 + "\r\n";
        retStr += "dig_P7: " + dig_P7 + "\r\n";
        retStr += "dig_P8: " + dig_P8 + "\r\n";
        retStr += "dig_P9: " + dig_P9 + "\r\n";

        retStr += "dig_H1: " + dig_H1 + "\r\n";
        retStr += "dig_H2: " + dig_H2 + "\r\n";
        retStr += "dig_H3: " + dig_H3 + "\r\n";
        retStr += "dig_H4: " + dig_H4 + "\r\n";
        retStr += "dig_H5: " + dig_H5 + "\r\n";
        retStr += "dig_H6: " + dig_H6 + "\r\n";

        return retStr;
    }

    function DumpCurrentUncompensatedData(): string {
        let retStr: string = "";

        retStr += "CurrentUncompensatedData\r\n";
        retStr += "T: " + currentUncompensatedData.temperature + "\r\n";
        retStr += "P: " + currentUncompensatedData.pressure + "\r\n";
        retStr += "H: " + currentUncompensatedData.humidity + "\r\n";

        return retStr;
    }

    function DumpCurrentCompensatedData(): string {
        let retStr: string = "";

        retStr += "CurrentCompensatedData\r\n";
        retStr += "T: " + Temperature100() + "\r\n";
        retStr += "P: " + Pressure100() + "\r\n";
        retStr += "H: " + Humidity100() + "\r\n";

        return retStr;
    }

    //% blockId=BME280_I2C_serialoutsensordata
    //% block="SerialOutSensorData"
    //% weight=10
    export function SerialOutSensorData(): void {
        DebugWriteLine("SerialOutSensorData");
        if (IsUpdateNeeded())
            ReadSensorData();
        serial.writeLine(DumpCurrentUncompensatedData());
        serial.writeLine(DumpCurrentCompensatedData());
    }

    //% blockId=BME280_I2C_SerialOutCurrentState
    //% block="SerialOutCurrentState"
    //% weight=10
    export function SerialOutCurrentState(): void {
        DebugWriteLine("SerialOutCurrentState");
        serial.writeLine(DumpCurrentState());
        serial.writeLine(DumpCalibrationData());
        serial.writeLine(DumpCurrentUncompensatedData());
        serial.writeLine(DumpCurrentCompensatedData());
    }
}
