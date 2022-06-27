enum ValueFormat {
    Int8LE = 1,
    UInt8LE = 2,
    Int16LE = 3,
    UInt16LE = 4,
}

/**
 * Send component enum.
 */
enum SendComponent {
    //% block="Speed"
    Speed = 100,
    //% block="Distance"
    Distance,
}

/**
 * Received component enum.
 */
enum ReceivedComponent {
    //% block="Button"
    Button = 100,
    //% block="Joystick"
    Joystick,
}

/**
 * Component ID.
 */
enum ComponentID {
    ID0 = 0,
    ID1,
    ID2,
    ID3,
    ID4,
    ID5,
    ID6,
    ID7,
    ID8,
    ID9,
    ID10,
    ID11,
    ID12,
    ID13,
    ID14,
    ID15,
}

/**
 * Supports for remote:bit service.
 */
//% weight=49 icon="\uf10b" color=#36C2F9
namespace remotebit {
    const onReceivedFormats: { [key: string]: ValueFormat } = { }
    const onReceivedHandlers: { [key: string]: (values: number[]) => void } = { }

    /**
     * Starts remote:bit.
     */
    //% blockId=remotebit_start block="remote:bit start"
    //% weight=90 blockGap=8
    export function start(): void {
        rawbluetooth.startService();

        // on received buffer
        control.onEvent(MICROBIT_ID_RAWBLUETOOTH, MICROBIT_RAWBLUETOOTH_EVT_RX, () => {
            const buffer = rawbluetooth.readBuffer();
            if (buffer.length >= 2) {
                const component: ReceivedComponent = buffer[0];
                const id: number = buffer[1];
                const format = onReceivedFormats[getHandlerId(component, id)];
                const newFormat = ValueFormat2NumberFormat(format);
                const onReceivedHandler = onReceivedHandlers[getHandlerId(component, id)];
                if (onReceivedHandler) {
                    const values: number[] = [];
                    for (let i = 2; i < buffer.length; i += newFormat.length) {
                        const value = buffer.getNumber(newFormat.format, i);
                        values.push(value);
                    }
                    onReceivedHandler(values);
                }
            }
        });
    }

    /**
     * Returns true if the remote:bit is connected.
     */
    //% blockId=remotebit_isconnected block="remote:bit is connected"
    //% weight=10 blockGap=8
    export function isConnected(): boolean {
        return rawbluetooth.isConnected();
    }

    /**
     * Sends value(s) to component of remote:bit.
     */
    //% blockId=remotebit_send
    //% block="remote:bit send values|to component %component id %id with %values of format %format"
    //% id.fieldEditor="gridpicker" id.fieldOptions.columns=4
    //% id.fieldOptions.tooltips="false" id.fieldOptions.width="250"
    //% weight=70 blockGap=8
    export function send(component: SendComponent, id: ComponentID, values: number[], format: ValueFormat): void {
        const newFormat = ValueFormat2NumberFormat(format);

        const buffer = Buffer.create(2 + values.length * newFormat.length);
        buffer.setNumber(NumberFormat.UInt8LE, 0, component);
        buffer.setNumber(NumberFormat.UInt8LE, 1, id);
        values.forEach((value, index) => {
            buffer.setNumber(newFormat.format, index * newFormat.length + 2, value);
        });
        rawbluetooth.writeBuffer(buffer);
    }

    /**
     * On remote:bit received values from a component.
     */
    //% blockId=remotebit_onreceived
    //% block="on remote:bit received|from component %component id %id with format %format"
    //% id.fieldEditor="gridpicker" id.fieldOptions.columns=4
    //% id.fieldOptions.tooltips="false" id.fieldOptions.width="250"
    //% weight=60 blockGap=32 draggableParameters
    export function onReceived(component: ReceivedComponent, id: ComponentID, format: ValueFormat, cb: (values: number[]) => void) {
        onReceivedFormats[getHandlerId(component, id)] = format;
        onReceivedHandlers[getHandlerId(component, id)] = cb;
    }

    /**
     * Gets handler id from component and id.
     */
    function getHandlerId(component: ReceivedComponent, id: ComponentID): string {
        return `on_${component}_${id}_received`;
    }

    /**
     * Converts ValueFormat to NumberFormat and length of NumberFormat.
     */
    function ValueFormat2NumberFormat(format: ValueFormat): { format: NumberFormat, length: number } {
        let newFormat = NumberFormat.Int8LE;
        let lengthOfFormat = 1;

        switch (format) {
            case ValueFormat.Int8LE:
                newFormat = NumberFormat.Int8LE;
                lengthOfFormat = 1;
                break;
            case ValueFormat.UInt8LE:
                newFormat = NumberFormat.UInt8LE;
                lengthOfFormat = 1;
                break;
            case ValueFormat.Int16LE:
                newFormat = NumberFormat.Int16LE;
                lengthOfFormat = 2;
                break;
            case ValueFormat.UInt16LE:
                newFormat = NumberFormat.UInt16LE;
                lengthOfFormat = 2;
                break;
        }

        return {
            format: newFormat,
            length: lengthOfFormat,
        };
    }
}
