import * as React from 'react';
import { isEqual } from 'lodash';

import { Issue, Contact } from '../../common/model';
import { CallState } from '../../redux/callState';
import CallHeader from './CallHeader';
import { ContactList } from '../../common/contactList';
import { ContactDetails } from '.';
import { locationStateContext, userStatsContext, userStateContext } from '../../contexts';
import Script from './Script';
import { ContactProgress } from './ContactProgress';
import { getContactsIfNeeded } from '../../redux/remoteData/asyncActionCreator';
import { eventContext } from '../../contexts/EventContext';
import Outcomes from './Outcomes';

// This defines the props that we must pass into this component.
export interface Props {
  issue: Issue;
  contacts: ContactList;
  callState: CallState;
}

export interface State {
  currentContact: Contact | undefined;
  currentContactIndex: number;
  numberContactsLeft: number;
}

export class Call extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // set initial state
    this.state = this.setStateFromProps(props);
  }

  componentDidMount() {
    getContactsIfNeeded(false);
  }

  /**
   * Set state from props when props
   * are initialized or refreshed
   *
   * @param {Props} props
   * @returns {State}
   */
  setStateFromProps(props: Props): State {
    let currentContactIndex = 0;
    if (props.issue && props.callState.contactIndexes && props.callState.contactIndexes[props.issue.slug]) {
      currentContactIndex = props.callState.contactIndexes[props.issue.slug];
    }

    // after this contact, the number of contacts that are left to connect with
    const numberContactsLeft = props.issue &&
      (props.issue.numberOfContacts(this.props.contacts) - (currentContactIndex + 1));
    const currentContact = props.issue.currentContact(this.props.contacts, currentContactIndex);

    return {
      currentContact: currentContact,
      currentContactIndex: currentContactIndex,
      numberContactsLeft: numberContactsLeft,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps, this.props)) {
      this.setState(this.setStateFromProps(this.props));
    }
  }

  selectContact(index: number) {
    const currentContact = this.props.issue.currentContact(this.props.contacts, index);
    this.setState({ currentContactIndex: index, currentContact: currentContact });
  }

  render() {
    return (
      <section className="call">
        <CallHeader
          currentIssue={this.props.issue}
        />
        <userStatsContext.Consumer>
        { userStatsState => 
          <ContactProgress
            currentIssue={this.props.issue}
            contactList={this.props.contacts}
            callState={this.props.callState}
            userStatsState={userStatsState}
            currentContact={this.state.currentContact}
            selectContact={(index) => { this.selectContact(index); }}
          />
        }
        </userStatsContext.Consumer>
        {this.state.currentContact &&
          <>
          <ContactDetails
            currentIssue={this.props.issue}
            currentContact={this.state.currentContact}
          />
          <locationStateContext.Consumer>
            {locationState =>
              <>
              {/* this is sort of weird, right? Should be implicit from above */}
              {this.state.currentContact &&
              <Script
                issue={this.props.issue}
                currentContact={this.state.currentContact}
                locationState={locationState}
              />
              }
              </>
            }
          </locationStateContext.Consumer>
           <userStateContext.Consumer>
             {userState =>
               <eventContext.Consumer>
                 {eventManager =>
                   <Outcomes
                     currentIssue={this.props.issue}
                     userState={userState}
                     eventEmitter={eventManager.ee}
                     numberContactsLeft={this.state.numberContactsLeft}
                     currentContactId={(this.state.currentContact ? this.state.currentContact.id : '')}
                   />                
                 }
               </eventContext.Consumer>
             }
           </userStateContext.Consumer> 
          </>
        }
      </section>
    );
  }
}
