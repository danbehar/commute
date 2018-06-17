// TODO: Enter values for the following.
const GOOGLE_MAPS_KEY = '';
const addrsDest = [''];
const addrsSrc = [''];

const morningTimes = [9, 9.5];
const eveningTimes = [17.5, 18];

const TIME_ZONE = 'America/Los_Angeles';

const moment = require('moment');
require('moment-timezone');

const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_KEY,
  Promise: Promise
});

const logError = (err) => {
  if (err && err.message) {
    console.log('Error: ' + err + ' ' + err.message + ' ' + err.stack);
  }
  console.log(JSON.stringify(err));
};

const executeCommuteCall = async (origins, destinations, time, trafficModel) => {
  try {
    const response = await googleMapsClient.distanceMatrix({
      origins,
      destinations,
      mode: 'driving',
      departure_time: time,
      traffic_model: trafficModel
    })
      .asPromise();
    return transformResponse(response, time, trafficModel);
  } catch (err) {
    // Sample conition that will throw an error: Date is in the past.
    logError(err);
    // Note that falsey values are filtered out at the end.
    // Could possibly do something else, but output file will indicate something.
  }
};
const transformResponse = (response, time, trafficModel) => {
  const results = [];
  if (response.json.status !== 'OK') {
    logError(response.json);
    return;
  }
  for (let srcAddrNum = 0; srcAddrNum < response.json.rows.length; srcAddrNum++) {
    const srcAddress = response.json.origin_addresses[srcAddrNum];
    const row = response.json.rows[srcAddrNum];
    for (let destAddrNum = 0; destAddrNum < row.elements.length; destAddrNum++) {
      const destAddr = response.json.destination_addresses[destAddrNum];
      const element = response.json.rows[srcAddrNum].elements[destAddrNum];
      if (element.status !== 'OK') {
        logError(element);
        continue;
      }
      const distance = element.distance.text;
      const durationNoTraffic = element.duration.text;
      const durationWithTraffic = element.duration_in_traffic.text;
      results.push({
        srcAddress, destAddr, distance, durationNoTraffic, durationWithTraffic
      });
    }
  }
  // Enhance with some of the request info
  return results.map(result => ({
    ...result,
    time,
    trafficModel
  }));
};

const makeCommuteTime = time => moment()
  .tz(TIME_ZONE)
  .startOf('week')
  .add(1, 'week') // Date must be in the future
  .add(3, 'day') // Mid-week (Wednesday)
  .add(time, 'hours')
  .toDate();

const getCommuteInfos = (srcAddr, destAddrs, commuteTimes) => {
  const results = [];
  ['best_guess', 'optimistic', 'pessimistic'].forEach((commuteType) => {
    commuteTimes.forEach((time) => {
      results.push(executeCommuteCall(srcAddr, destAddrs, time, commuteType));
    });
  });
  return results;
};

const flatMap = arr => arr.reduce((accum, curr) => accum.concat(curr), []);

const log = (results) => {
  const DELIMITER = '\t';
  console.log(['Source Address', 'Dest Addr', 'Time', 'Traffic Model',
    'Duration Traffic', 'Duration no Traffic', 'Distance'].join(DELIMITER));
  results.forEach((result) => {
    console.log([
      result.srcAddress, result.destAddr, moment(result.time).tz(TIME_ZONE).format('HH:mm'),
      result.trafficModel, result.durationWithTraffic, result.durationNoTraffic, result.distance
    ].join(DELIMITER));
  });
};

Promise.all(flatMap([
  getCommuteInfos(addrsSrc, addrsDest, morningTimes.map(makeCommuteTime)),
  getCommuteInfos(addrsDest, addrsSrc, eveningTimes.map(makeCommuteTime))
])).then((results) => {
  const allData = flatMap(results).filter(data => !!data);
  log(allData);
});
