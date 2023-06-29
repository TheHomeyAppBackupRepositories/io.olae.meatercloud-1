'use strict';

const Homey = require('homey');
const Https = require('https');

const apihost = "public-api.cloud.meater.com";

class MeaterCloudApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MeaterCloudApp has been initialized');

    // Update every minute
    this.homey.setInterval(() => {
      this.updateDevices();
    }, 6000);

    this.homey.settings.on('set', key => {
      let s = this.homey.settings;

      if( key === 'email' || key === 'password' ) {
        this.log("Settings updated for key: " + key);

        // Resolve api token if we have both email and password
        if( s.getKeys().includes('email') && s.getKeys().includes('password') ) {
          this.log("Trying to resolve API key for user " + s.get('email') + " from host " + apihost);

          const data = JSON.stringify({
            "email": s.get('email'),
            "password": s.get('password')
          });

          const options = {
            host: apihost,
            port: 443,
            path: '/v1/login',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': data.length
            }
          }

          const req = Https.request(options, resp => {
            let body = '';

            this.log("Login request returned statusCode " + resp.statusCode);

            // Process chunk
            resp.on('data', chunk => {
              body += chunk;
            })

            // Process response
            resp.on('end', () => {
              if( resp.statusCode !== 200 ) {
                return;
              }

              if( body.length === 0 ) {
                this.log("ERROR: Login returned zero byte body.");
                return;
              }

              // Parse json
              body = JSON.parse(body);

              // Save data
              s.set('userid', body.data.userId);
              s.set('token', body.data.token);

              // Report successful login
              this.log("Successfully logged in with userid: " + s.get('userid'));
              this.homey.notifications.createNotification({ excerpt: `${this.homey.__('notifications.login_successful')}` });
            });

            // Report failed login
            if( resp.statusCode === 401 ) {
              this.log('ERROR: Login returned 401 Unauthorized');
              this.homey.notifications.createNotification({ excerpt: `Meater: ${this.homey.__('notifications.login_failed')}` });
              return;
            }

            // Handle unknown response
            if( resp.statusCode !== 200 ) {
              this.log("ERROR: An unknown status code was returned for login request");
              return;
            }
          })

          req.on('error', error => {
            this.log(error);
          })

          req.write(data);
          req.end();
        }
      }
    });
  }

  async updateDevices() {
  let driver = this.homey.drivers.getDriver('meater-probe');
  let devices = driver.getDevices();

  // Nothing to update of there are no devices
  if( devices.length === 0 ) {
    return;
  }

  const options = {
    host: apihost,
    port: 443,
    path: '/v1/devices',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.homey.settings.get('token')
    }
  }

  const req = Https.request(options, resp => {
    let body = '';

    this.log("Device update request returned statusCode " + resp.statusCode);

    // Process chunk
    resp.on('data', chunk => {
      body += chunk;
    })

    // Process response
    resp.on('end', () => {
      if( resp.statusCode !== 200 ) {
        this.log("ERROR: Device update request did not return status 200");
        return;
      }

      if( body.length === 0 ) {
        this.log("ERROR: Device update request returned zero byte body.");
        return;
      }

      // Parse json
      body = JSON.parse(body);

      // Report successful login
      this.log("Successfully received data for " + body.data.devices.length + " devices");

      let apiDevices = body.data.devices;

      devices.forEach(localDevice => {
        let deviceFound = false;
        apiDevices.forEach(apiDevice => {
          if( apiDevice.id === localDevice.getData().id ) {
            deviceFound = 1;

            // Bring device online
            if( ! localDevice.getAvailable() ) {
              this.log("A device went available: " + apiDevice.id);
              localDevice.setAvailable();
            }

            localDevice.setInternalTemperature(apiDevice.temperature.internal);
            localDevice.setAmbientTemperature(apiDevice.temperature.ambient);

            if(apiDevice.cook !== null ) {
              localDevice.createCook(apiDevice.cook.id);
              localDevice.setCookName(apiDevice.cook.name);

              if(apiDevice.cook.time !== null ) {
                localDevice.setElapsedTime(apiDevice.cook.time.elapsed);
                localDevice.setRemainingTime(apiDevice.cook.time.remainig);
              }
              else {
                localDevice.setElapsedTime(0);
                localDevice.setRemainingTime(0);
              }

              if( apiDevice.cook.temperature !== null ) {
                localDevice.setTargetTemperature(apiDevice.cook.temperature.target);
                localDevice.setPeakTemperature(apiDevice.cook.temperature.peak);
              }
              else {
                // Set to zero as we have no data
                localDevice.setTargetTemperature(0);
                localDevice.setPeakTemperature(0);
              }
            }
            else {
              localDevice.removeCook();
            }
          }
        })

        // Set unavailable if no longer in report from API
        if(!deviceFound && localDevice.getAvailable()) {
            this.log("A device went unavailable: " + localDevice.getData().id);
            localDevice.setOffline();
            localDevice.setUnavailable();
        }
      });
    });

    // Report failed login
    if( resp.statusCode === 401 ) {
      this.log('ERROR: Device update request returned 401 Unauthorized');
      // this.homey.notifications.createNotification({ excerpt: `Meater: ${this.homey.__('notifications.login_failed')}` });
      return;
    }

    // Handle unknown response
    if( resp.statusCode !== 200 ) {
      this.log("ERROR: An unknown status code was returned for device update request");
      return;
    }
  })

  req.on('error', error => {
    this.log(error);
  })

  req.end();
  return;
}
}

module.exports = MeaterCloudApp;
