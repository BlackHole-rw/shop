import React from 'react'
import { Elements, CardElement, injectStripe, StripeProvider } from 'react-stripe-elements';
import { Container, Button, Message, Item, Header, Segment, Dimmer, Loader, Image, Label, Form, Dropdown } from "semantic-ui-react";

import { Link, withRouter } from 'react-router-dom'
import { authAxios } from '../utils'
import { checkoutURL, orderSummaryURL, couponFormURL, addressListURL } from '../constants'

class CheckoutForm extends React.Component {
    state = {
        loading: false,
        error: null,
        success: false,
        data: null,
        code: '',
        billingAddress: [],
        shippingAddress: [],
        selectedShippingAddress: '',
        selectedBillingAddress: ''
    }

    componentDidMount() {
        this.handleFetchOrder();
        this.handleFetchBillingAddress();
        this.handleFetchShippingAddress();
    }

    handleGetDefaultAddress = addresses => {
        const filteredAddress = addresses.filter(el => el.default === true);
        if (filteredAddress.length > 0) {
            return filteredAddress[0].id
        }
        return ''
    }

    handleChange = e => {
        this.setState({
            code: e.target.value
        })
    }

    handleSelectedChange = (e, {name, value}) => {
        this.setState({
            [name]: value
        })
    }

    handleSubmit = e => {
        const { code } = this.state;
        this.handleAddCoupon(e, code);
        this.setState({ code: '' });
    }

    handleFetchOrder = () => {
        this.setState({ loading: true })
        authAxios.get(orderSummaryURL)
        .then(res => {
            this.setState({ data: res.data, loading: false });
        })
        .catch(err => {
            if (err.response.status === 404 ) {
                this.props.history.push('/products')
            } else { this.setState({ error: err, loading: false }); }
        });
    }

    handleFetchBillingAddress = () => {
        this.setState({ loading: true })
        authAxios.get(addressListURL('B'))
        .then(res => {
            this.setState({ loading: false,
                            selectedBillingAddress: this.handleGetDefaultAddress(res.data),
                            billingAddress: res.data.map(b => {
                                return(
                                    {
                                        key: b.id,
                                        text: `${b.street_address}, ${b.country}`,
                                        value: b.id
                                    }
                                )
                    }
                )
            })
        })
        .catch(err => {
            this.setState({ loading: false, error: err })
        })
    }

    handleFetchShippingAddress = () => {
        this.setState({ loading: true })
        authAxios.get(addressListURL('S'))
        .then(res => {
            this.setState({ loading: false,
                            selectedShippingAddress: this.handleGetDefaultAddress(res.data),
                            shippingAddress: res.data.map(s => {
                                return(
                                    {
                                        key: s.id,
                                        text: `${s.street_address}, ${s.country}`,
                                        value: s.id
                                    }
                                )
                    }
                )
            })
        })
        .catch(err => {
            this.setState({ loading: false, error: err })
        })
    }

    handleAddCoupon = (ev, code) => {
        ev.preventDefault();
        this.setState({ loading: true })
        authAxios
        .post(couponFormURL, {code})
        .then(res => {
            this.setState({ loading: false, success: true });
            this.handleFetchOrder();
        })
        .catch(err => {
            this.setState({ error: err, loading: false });
        })
    }

    submit = (ev) => {
      ev.preventDefault();
      if (this.props.stripe){
        this.setState({ loading: true })
        this.props.stripe.createToken().then(result => {
            if (result.error) {
                this.setState({ error: result.error, loading: false })
            } else {
                this.setState({ error: null })
                const { selectedShippingAddress, selectedBillingAddress } = this.state;
                authAxios
                .post(checkoutURL,
                     {stripeToken: result.token.id,
                      selectedBillingAddress,
                      selectedShippingAddress})
                .then(res => {
                    this.setState({ loading: false, success: true });
                })
                .catch(err => {
                    this.setState({ error: err, loading: false });
                })
            }
        });
      } else {
        console.log("Stripe is not load")
      }
    }

    render() {
      const { data,
              error,
              loading,
              success,
              code,
              billingAddress,
              shippingAddress,
              selectedBillingAddress,
              selectedShippingAddress } = this.state;
      return (
          <div>
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
            <React.Fragment>
            <Header as='h3'>Order</Header>
            {data && (
                <React.Fragment>
                    <Item.Group relaxed>
                    {data.order_items.map((order_item, i )=> {
                        return(
                            <Item key={i}>
                              <Item.Image
                                size='tiny'
                                src={`http://127.0.0.1:8000${order_item.item_variations[1].attachment}`} />
                              <Item.Content>
                                <Item.Header>{order_item.quantity} x {order_item.item.title}</Item.Header>
                                <Item.Extra>
                                  <Label>${order_item.final_price}</Label>
                                </Item.Extra>
                              </Item.Content>
                            </Item>
                        )
                    })}
                    </Item.Group>
                    <Item.Group>
                        <Item>
                          <Item.Content>
                            <Item.Header>
                                Order Total: ${data.total}
                                {data.promo_code && (
                                <Label color='green' style={{ marginLeft: '10px'}}>
                                    Current coupon: {data.promo_code.code} for ${data.promo_code.amount}
                                </Label>
                                )}
                            </Item.Header>
                          </Item.Content>
                        </Item>
                    </Item.Group>
                </React.Fragment>
            )}
            </React.Fragment>
            <Form>
                <Form.Field>
                  <Header>Coupon:</Header>
                  <input placeholder='Enter a code..' value={code} onChange={this.handleChange}/>
                </Form.Field>
                <Button
                    primary onClick={this.handleSubmit}
                    style={{ marginTop: "10px" }}
                >
                    Send
                </Button>
            </Form>
            {billingAddress < 1 || shippingAddress < 1

            ?

                <p>You need <Link to='/profile'>add address</Link></p>

            :

              (
                <React.Fragment>
                    <Header>Select a billing address</Header>
                    <Dropdown
                        name='selectedBillingAddress'
                        value={selectedBillingAddress}
                        clearable options={billingAddress}
                        selection
                        onChange={this.handleSelectedChange}/>

                    <Header>Select a shipping address</Header>
                    <Dropdown
                        name='selectedShippingAddress'
                        value={selectedShippingAddress}
                        clearable options={shippingAddress}
                        selection
                        onChange={this.handleSelectedChange}/>

                    <Header>Would you like to complete the purchase?</Header>
                    <CardElement />
                    {success &&
                        (<Message positive>
                            <Message.Header>Your payment was successful</Message.Header>
                            <p>
                              Go to your <b>profile</b> to see the order delivery status.
                            </p>
                        </Message>)}
                    <Button
                        loading={loading}
                        primary onClick={this.submit}
                        style={{ marginTop: "10px" }}
                    >
                        Submit
                    </Button>
                </React.Fragment>
              )
            }
          </div>
        );
    }
};

const InjectedForm = withRouter(injectStripe(CheckoutForm));

const WrappedForm = () => {
return(
    <Container text>
        <StripeProvider apiKey='pk_test_TYooMQauvdEDq54NiTphI7jx'>
            <div>
                <h1>Complete your order</h1>
                <Elements>
                    <InjectedForm />
                </Elements>
            </div>
        </StripeProvider>
    </Container>)
}

export default WrappedForm;