/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const React = require('react')
const ReactDOM = require('react-dom')
const propTypes = require('prop-types')
const _ = require('lodash')
const Color = require('color')

const middleEllipsis = require('../../utils/middle-ellipsis')

const { Provider, Modal, Txt, Heading, Box, Flex } = require('rendition')
const {
  ModalHeader,
  CloseButton,
  ModalBody,
} = require('./../modal-styles')

const styled = require('styled-components').default

const controller = require('./drive-selector-service')


const { colors } = require('./../../theme')
const shared = require('/./../../../../../lib/shared/units')
const constraints = require('./../../../../shared/drive-constraints')

const selectionState = require('./../../models/selection-state')

const DeviceListElem = styled(Box) `
  font-size: 12px;
  padding: 11px 0;
  border-bottom: 1.5px solid ${colors.light.soft.background};
  width: 100%;
  cursor: pointer;
`

const DeviceList = styled(Box)`
  margin: -50px 15px -35px 15px;
`

const Tick = styled(Txt.span) `
  font-size: 12px;
  border: 2px solid;
  border-radius: 50%;
  padding: 3px;

  border-color: ${(props) => { return props.success ?
    colors.success.foreground :
    props.error ? colors.danger.foreground :
    props.disabled ? '#b3b3b3' : colors.light.foreground}
  }

  background-color: ${(props) => { return props.success ?
    colors.success.background :
    props.error ? colors.danger.background : colors.dark.foreground}
  }

  color: ${(props) => { return props.success ?
    colors.success.foreground :
    props.error ? colors.danger.foreground :
    props.disabled ? '#b3b3b3' : colors.light.foreground}
  }

`

const Label = styled(Txt)`
  height: 18px;
  border-radius: 10px;

  'label-warning': status.type === modal.constraints.COMPATIBILITY_STATUS_TYPES.WARNING,
  'label-danger': status.type === modal.constraints.COMPATIBILITY_STATUS_TYPES.ERROR

  color: ${colors.warning.foreground};
  background-color:
    ${(props) =>
      {
        if (props.type === constraints.COMPATIBILITY_STATUS_TYPES.WARNING) {
          return colors.warning.background
        }
        if (props.type === constraints.COMPATIBILITY_STATUS_TYPES.ERROR) {
          return colors.danger.background
        }
        else return '#666'
      }
    };
`

class DriveSelector extends React.PureComponent {

  constructor(props) {
    super(props)

    this.state = {
      availableDrives: controller.getAvailableDrives(),
    }
  }

  getCurrentSelectedDevices = () => {
    return this.props.currentSelectedDrives.map((drive) => drive.device)
  }

  componentDidMount () {    //TODO: do not rerender if not needed as in drive selector
    this.timer = setInterval(() => {
      if (!_.isEqual(this.state.availableDrives, controller.getAvailableDrives())) {
        this.setState({ availableDrives: controller.getAvailableDrives() })
      }
    },500)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  handleClick = (drive) => {
    if (constraints.isDriveValid(drive, this.props.image)) {
      if (this.getCurrentSelectedDevices().includes(drive.device)) {
        this.props.currentSelectedDrives.splice(this.getCurrentSelectedDevices().indexOf(drive.device),1)
      }
      else {
        this.props.currentSelectedDrives.push(drive)
      }
      this.forceUpdate()
    }
  }

  addDrivesLabels = (drive) => {
    return controller.getDriveStatuses(drive,this.props.image).map((status, index) =>
      <Label type={status.type} key={index} >
        {status.message}
      </Label>
    )
  }

  renderDrivesList() {
    return controller.hasAvailableDrives() ?
      controller.getAvailableDrives().map((drive) =>
        <Provider key={drive.device}>
          <DeviceListElem
            onClick={() => this.handleClick(drive)}
          >
            <Flex flexDirection='row'
              justify='space-between'
              style={{ alignItems: 'center'}}
            >
              <Flex flexDirection='column'>
                <Heading.h6
                  color={constraints.isDriveValid(drive, this.props.image) ? '#666' : '#b3b3b3'}
                  align='left'
                >
                  {drive.description}{' '}-{' '}{shared.bytesToClosestUnit(drive.size)}
                </Heading.h6>
                <Txt
                  color='#b3b3b3'
                  size='11px'
                  align='left'
                  style={{padding: 0}}
                >
                  {drive.device}
                </Txt>
                { this.addDrivesLabels(drive) }
              </Flex>
              <Tick
                disabled={!constraints.isDriveValid(drive, this.props.image)}
                success={this.getCurrentSelectedDevices().includes(drive.device)}
                className="glyphicon glyphicon-ok"
              />
            </Flex>
          </DeviceListElem>
        </Provider>
      )
      :
      (
        <Provider key={'empty'}>
          <DeviceListElem>
            <Flex flexDirection='column'>
              <Heading.h6
                color='#666'
                align='left'
              >
                Connect a drive!
              </Heading.h6>
              <Txt
                color='#b3b3b3'
                size='11px'
                align='left'
                style={{padding: 0}}
              >
                No removable drive connected.
              </Txt>
            </Flex>
          </DeviceListElem>
        </Provider>
      )
    }

  render() {
    console.log(this.props.currentSelectedDrives)
    console.log(constraints.hasListDriveImageCompatibilityStatus(this.props.currentSelectedDrives,this.props.image))
    return(
      <Provider>
        <Modal
          width='400px'
          style={{padding: '0 10px 15px 15px'}}
          titleElement={
            <React.Fragment>
              <ModalHeader>
                <Txt>SELECT DRIVERS</Txt>
              </ModalHeader>
            </React.Fragment>
          }
          primaryButtonProps={{
            disabled: this.props.currentSelectedDrives.length == 0,
            warning: constraints.hasListDriveImageCompatibilityStatus(this.props.currentSelectedDrives,this.props.image),
            primary: !constraints.hasListDriveImageCompatibilityStatus(this.props.currentSelectedDrives,this.props.image)
          }}
          action='Continue'
          done={() => this.props.callback('DONE', this.props.currentSelectedDrives)}
          cancel={() => this.props.callback('CANCEL')}
        >
          <Box>
            <DeviceList>
              {this.renderDrivesList()}
              {constraints.hasListDriveImageCompatibilityStatus(this.props.currentSelectedDrives,this.props.image) &&
                <Txt color='#666' align='justify' size='8px'>
                  WARNING: You have chosen one or more drives with warning label. Proceed with caution!
                </Txt>
              }
            </DeviceList>
          </Box>
        </Modal>
      </Provider>
    )
  }

}

DriveSelector.propTypes = {
  image: propTypes.object,
  callback: propTypes.func,
  currentSelectedDrives: propTypes.array
}

module.exports = DriveSelector
