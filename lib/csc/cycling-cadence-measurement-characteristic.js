var debugCSC = require('debug')('csc');
var Bleno = require('bleno');
var util = require('util');
// Spec
//https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.cycling_power_measurement.xml

class CyclingCadenceMeasurementCharacteristic extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2A5B',
      value: null,
      properties: ['notify'],
      descriptors: [
        new Bleno.Descriptor({
					uuid: '2901',
					value: 'Cycling Cadence Measurement'
				}),
        new Bleno.Descriptor({
          // Client Characteristic Configuration
          uuid: '2902',
          value: Buffer.alloc(2)
        }),
        new Bleno.Descriptor({
          // Server Characteristic Configuration
          uuid: '2903',
          value: Buffer.alloc(2)
        })
      ]
    });
    this._updateValueCallback = null;  
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    debugCSC('[CyclingCadenceMeasurementCharacteristic] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    debugCSC('[CyclingCadenceMeasurementCharacteristic] client unsubscribed from PM');
    this._updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };

  notify(event) {
    if (!('rev_count' in event)) {
      // ignore events with no power and no crank data
      return this.RESULT_SUCCESS;;
    }
    var buffer = new Buffer(14);
    var offset = 0;
    // flags
    // 00000001 - 1   - 0x01 - Speed
    // 00000010 - 2   - 0x02 - Cadence
	if (('rev_count' in event) && ('wheel_count' in event)) {
	  buffer.writeUInt8(0x03, offset);
	} else if (('rev_count' in event) && !('wheel_count' in event)) {
	  buffer.writeUInt8(0x02, offset);
	} else if (!('rev_count' in event) && ('wheel_count' in event)) {
	  buffer.writeUInt8(0x01, offset);
	}
  offset += 1
 
  	// Speed
    if ('wheel_count' in event) {      
      event.wheel_count = event.wheel_count % 65536;

      buffer.writeUInt32LE(event.wheel_count, offset);
      offset += 4
      var wheel_time = (event.wheel_count * event.spd_int) % 65536;
      
      buffer.writeUInt16LE(wheel_time, offset);
      offset += 2
    }
  
  	// Cadence
    if ('rev_count' in event) {      
      event.rev_count = event.rev_count % 65536;
      
      buffer.writeUInt16LE(event.rev_count, offset);  
      offset += 2
      buffer.writeUInt16LE(event.cad_time, offset);
    }
    
  	debugCSC('CSC cad:' + event.cadence + ' spd:' + event.powerMeterSpeed + ' rev_count:' + event.rev_count + ' cad_time:' + event.cad_time + ' wheel_count:' + event.wheel_count + ' wheel_time:' + wheel_time + ' Msg:' + util.inspect(buffer));

    if (this._updateValueCallback) {
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  } 
};

module.exports = CyclingCadenceMeasurementCharacteristic;
