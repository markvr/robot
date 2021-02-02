# Robot Arm

## Configure Pi and install dependencies

This guide assumes your Pi is dedicated to this project as an embedded system,
and you are logged in as the root user to manage it.

Some useful links are:

- https://learn.adafruit.com/adafruit-16-channel-pwm-servo-hat-for-raspberry-pi/using-the-python-library
- https://learn.adafruit.com/circuitpython-on-raspberrypi-linux

Run the following commands:

    apt update

    # Avoid any python 2/3 confusion by just removing python2
    # and installing python3
    apt remove -y python2   
    apt install -y python3 python3-pip pipenv i2c-tools libatlas-base-dev
    ln -s /usr/bin/python3 /usr/bin/python
    ln -s /usr/bin/pip3 /usr/bin/pip

    # Configure the Pi (enable I2C & camera)
    raspi-config nonint do_i2c 0
    raspi-config nonint do_camera 0
    
Download/clone this repo to `/opt/robot` and `cd` into it.  This project uses `Pipfile` and `Pipfile.lock`,  to specify all Python dependencies. 

Install them with:

        pipenv install --system

Using `Pipfile` for all Python dependencies ensures a deterministic and repeatable process, 
and avoids conflicts between system (`apt`) provided dependencies and python (`pip`) ones.

To set a servo on the command line run:

    ./cmd.py <servo> <angle>

Or start the website with:

    ./website.sh

There is a systemd file to start the website automatically. Install it with:

    cp /opt/robot/robot.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl start robot
    systemctl enable robot