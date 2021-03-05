import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
    Divider,
    Button,
    Header,
    Grid,
    Menu,
    Form,
    Message,
    Segment,
    Dimmer,
    Loader,
    Image,
    Select,
    Label,
    Card,
    Table
} from 'semantic-ui-react';
import {
    addressListURL,
    addressCreateURL,
    countryListURL,
    userIdURL,
    addressUpdateURL,
    addressDeleteURL,
    paymentHistoryURL
} from '../constants';
import { authAxios } from '../utils'

const UPDATE_FORM = "UPDATE_FORM";
const CREATE_FORM = "CREATE_FORM";

class AddressForm extends React.Component {

    state = {
        error: null,
        success: false,
        saving: false,
        formData: {
            address_type: "",
            apartment_address: "",
            country: "",
            default: false,
            id: '',
            street_address: "",
            user: 1,
            zip: ""
        },
    }

    componentDidMount() {
        const { formType, address } = this.props;
        if (formType === "UPDATE_FORM") {
            this.setState({formData: address})
        }
    }

    handleChange = e => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            [e.target.name]: e.target.value
        }
        this.setState({
            formData: updateFormData
        })
    }

    handleSelectChange = (e, {name, value}) => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            [name]: value
        }
        this.setState({ formData: updateFormData })
    }

    handleChecked = () => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            default: !formData.default
        }
        this.setState({ formData: updateFormData })
    }

    handleCreateAddress = e => {
        this.setState({ saving: true })

        const { userId, activeItem } = this.props;
        const { formData } = this.state;

        authAxios.post(addressCreateURL, {
            ...formData,
            user: userId,
            address_type: activeItem === 'billingAddress' ? 'B' : 'S'
        })
        .then(res => {
            this.setState({ saving: false, success: true });
            this.props.callback();
        })
        .catch(err => {
            this.setState({ error: err });
        });
    }

    handleSubmit = e => {
        this.setState({ saving: true})
        e.preventDefault();
        const { formType } = this.props;
        if ( formType === "UPDATE_FORM" ) {
            this.handleUpdateAddress()
        } else {
            this.handleCreateAddress()
        }
    }

    handleUpdateAddress = () => {
        const { userId, activeItem } = this.props;
        const { formData } = this.state;
        authAxios.put(addressUpdateURL(formData.id), {
            ...formData,
            user: userId,
            address_type: activeItem === 'billingAddress' ? 'B' : 'S'
        })
        .then(res => {
            this.setState({ saving: false, success: true });
            this.props.callback();
        })
        .catch(err => {
            this.setState({ error: err });
        });
    }

    render() {
        const { error, saving, success, formData } = this.state
        const { countries } = this.props
        return(
            <Form onSubmit={this.handleSubmit} success={success} error={error}>
                <Form.Input
                    required
                    name='street_address'
                    placeholder='Street address'
                    onChange={this.handleChange}
                    value={formData.street_address} />
                <Form.Input
                    required
                    name='apartment_address'
                    placeholder='Apartment address'
                    onChange={this.handleChange}
                    value={formData.apartment_address} />
                <Form.Field required>
                    <Select
                        loading={countries.length < 1 }
                        fluid
                        clearable
                        search
                        options={countries}
                        name='country'
                        placeholder='Country'
                        onChange={this.handleSelectChange}
                        value={formData.country} />
                </Form.Field>
                <Form.Input
                    required
                    name='zip'
                    placeholder='Zip code'
                    onChange={this.handleChange}
                    value={formData.zip} />
                <Form.Checkbox
                    name='default'
                    label='Make this the default address?'
                    onChange={this.handleChecked}
                    checked={formData.default} />
                {success &&
                <Message
                      success
                      header='Success!'
                      content="Your address was saved"
                    />}
                {error && (
                    <Message
                        error
                        header='There was some errors with your submission'
                        list={[JSON.stringify(error)]}
                      />)}
                <Form.Button type='submit' disable={saving} loading={saving} primary>Save</Form.Button>
            </Form>
        )
    }
}

class Profile extends React.Component {

    state = {
        loading: false,
        activeItem: 'billingAddress',
        addresses: [],
        error: null,
        formData: { default: false },
        countries: [],
        checked: false,
        userId: null,
        selectedAddress: null,
        payment: []
    }

    componentDidMount() {
        this.handleFetchAddresses();
        this.handleFetchCountries();
        this.handleFetchUserId();
    }

    handleDeleteAddress = addressID => {
        authAxios.delete(addressDeleteURL(addressID))
        .then(res => {
            this.handleCallback()
        })
        .catch(err => {
            this.setState({ error: err })
        })
    }

    handleSelectAddress = address => {
        this.setState({ selectedAddress: address })
    }

    handleItemClick = name => this.setState(
            { activeItem: name },
            name === 'paymentHistory' ? () => {this.handleFetchPaymentHistory()} : () => { this.handleFetchAddresses()}
        )

    handleFormatCountries = countries => {
        const keys = Object.keys(countries);
        return keys.map(k => {
            return {
                k: k,
                text: countries[k],
                value: k
            }
        })
    }

    handleFetchUserId = () => {
        authAxios.get(userIdURL)
        .then(res => {
            this.setState({ userId: res.data.userId })
        })
        .catch(err => {
            this.setState({ error: err })
        })
    }

    handleFetchCountries = () => {
        authAxios.get(countryListURL)
        .then(res => {
            this.setState({ countries: this.handleFormatCountries(res.data) })
        })
        .catch(err => {
            this.setState({ error: err })
        })
    }

    handleFetchPaymentHistory = () => {
        this.setState({ loading: true })
        authAxios.get(paymentHistoryURL)
        .then(res => {
            this.setState({ loading: false, payment: res.data })
        })
        .catch(err => {
            this.setState({ loading: false, error: err })
        })
    }

    handleFetchAddresses = () => {
        this.setState({ loading: true })
        const { activeItem } = this.state;
        authAxios.get(addressListURL(activeItem === 'billingAddress' ? 'B' : 'S'))
        .then(res => {
            this.setState({ loading: false, addresses: res.data })
        })
        .catch(err => {
            this.setState({ loading: false, error: err })
        })
    }

    handleCallback = () => {
        this.handleFetchAddresses();
        this.setState({ selectedAddress: null })
    }

    handleActiveItem = activeItem => {
        if (activeItem === 'paymentHistory') {
            return 'Payment History'
        } else if (activeItem === 'billingAddress') {
            return 'Billing Address'
        } else return 'Shipping Address'
    }

    render() {
        const { isAuthenticated } = this.props;
        if (!isAuthenticated) {
            return <Redirect to='/login' />
        }

        const { activeItem, error, addresses, loading, countries, selectedAddress, userId, payment } = this.state
        return(
            <Grid container columns={2} divided>
                {error && (
                    <Message
                        error
                        header='There was some errors with your submission'
                        list={[JSON.stringify(error)]}
                      />)}
                {loading &&  (
                    <Segment>
                      <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                      </Dimmer>
                      <Image src='/images/wireframe/short-paragraph.png' />
                    </Segment>)}
                <Grid.Row>
                    <Grid.Column width={6}>
                        <Menu pointing vertical fluid>
                            <Menu.Item
                              name='billingAddress'
                              active={activeItem === 'billingAddress'}
                              onClick={() => this.handleItemClick('billingAddress')}
                            />
                            <Menu.Item
                              name='shippingAddress'
                              active={activeItem === 'shippingAddress'}
                              onClick={() => this.handleItemClick('shippingAddress')}
                            />
                            <Menu.Item
                              name='paymentHistory'
                              active={activeItem === 'paymentHistory'}
                              onClick={() => this.handleItemClick('paymentHistory')}
                            />
                        </Menu>
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <Header>{`${this.handleActiveItem(activeItem)}`}</Header>
                        <Divider />
                        {
                            activeItem === 'paymentHistory'
                            ?
                                (<Table celled>
                                    <Table.Header>
                                      <Table.Row>
                                        <Table.HeaderCell>Id</Table.HeaderCell>
                                        <Table.HeaderCell>Amount</Table.HeaderCell>
                                        <Table.HeaderCell>Date</Table.HeaderCell>
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {payment && payment.map((payment, i) => {
                                            return(
                                                <Table.Row key={payment.id}>
                                                    <Table.Cell>{i+1}</Table.Cell>
                                                    <Table.Cell>${payment.amount}</Table.Cell>
                                                    <Table.Cell>{payment.timestamp}</Table.Cell>
                                                </Table.Row>
                                            )
                                        })}
                                    </Table.Body>
                                </Table>)
                            :
                            <React.Fragment>
                            <Card.Group>
                            {addresses.map(a => {
                                return(
                                     <Card key={a.id}>
                                      <Card.Content>
                                        {a.default &&
                                        <Label as='a' color='blue' ribbon='right'>
                                          Default
                                        </Label>}
                                        <Card.Header>{a.street_address}, {a.apartment_address}</Card.Header>
                                        <Card.Meta>{a.country}</Card.Meta>
                                        <Card.Description>
                                          {a.zip}
                                        </Card.Description>
                                      </Card.Content>
                                      <Card.Content extra>
                                        <div className='ui two buttons'>
                                          <Button color='green' onClick={() => this.handleSelectAddress(a) }>
                                            Update
                                          </Button>
                                          <Button color='red' onClick={() => this.handleDeleteAddress(a.id)}>
                                            Delete
                                          </Button>
                                        </div>
                                      </Card.Content>
                                    </Card>
                                     )
                                })}
                            </Card.Group>
                            <Divider />
                            {selectedAddress === null ?
                                <AddressForm
                                    activeItem={activeItem}
                                    countries={countries}
                                    formType={CREATE_FORM}
                                    userId={userId}/>
                            : null }
                            {selectedAddress &&
                                <AddressForm
                                    activeItem={activeItem}
                                    countries={countries}
                                    address={selectedAddress}
                                    formType={UPDATE_FORM}
                                    userId={userId}
                                    callback={this.handleCallback}/> }
                            </React.Fragment>
                        }
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}

const mapStateToProps = state => {
    return{
        isAuthenticated: state.auth.token !== null
    };
};

export default connect(mapStateToProps)(Profile);