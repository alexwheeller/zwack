const Bleno = require('bleno');

const CyclingCadenceMeasurementCharacteristic = require('./cycling-cadence-measurement-characteristic');
const StaticReadCharacteristic = require('../read-characteristic');

class CyclingCadenceService extends Bleno.PrimaryService {

  constructor() {
    let cadenceMeasurement = new CyclingCadenceMeasurementCharacteristic();
    super({
        uuid: '1816',
        characteristics: [
          cadenceMeasurement,
          new StaticReadCharacteristic('2A5D', 'Sensor Location', [13])         // 13 = rear hub
        ]
    });

    this.cadenceMeasurement = cadenceMeasurement;
  }

  notify(event) {
    this.cadenceMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };
}

module.exports = CyclingCadenceService;
