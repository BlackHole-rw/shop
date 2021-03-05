import React from 'react';
import { Container, Header, Table, Label, Button, Message, Image, Segment, Dimmer, Loader, Icon } from "semantic-ui-react";
import { Link } from 'react-router-dom';

import { authAxios } from '../utils';
import { addToCartURL, orderSummaryURL, orderItemDeleteURL,orderItemMinusURL } from '../constants';


class OrderSummary extends React.Component {

    state = {
        loading: false,
        error: null,
        data: null
    }

    componentDidMount() {
        this.setState({ loading: true })
        authAxios.get(orderSummaryURL)
        .then(res => {
            this.setState({ data: res.data, loading: false });
        })
        .catch(err => {
//            if (err.response.status === 404) {
//                this.setState({ error: "You currently do not have an order", loading: false })
//            } else {
                this.setState({ error: err, loading: false });
//            }
        });
    }

    renderVariations = orderItem => {
        let text = '';
        orderItem.item_variations.forEach(iv => {
            text += `${iv.variation.name}: ${iv.value}, `
        });
        return text;
    }

    handleDeleteProduct = itemId => {
        this.setState({ loading: true })
        authAxios.delete(orderItemDeleteURL(itemId))
        .then(res => {
            this.handleFetchOrder()
        })
        .catch(err => {
            this.setState({ error: err, loading: false });
        });
    }

    handleFormData = itemVariations => {
    // convert [{id:1},{id:2}] to [1, 2] - they're all variations
        return Object.keys(itemVariations).map(key => {
            return itemVariations[key].id;
        })
    }

    handleAddQuantity = (slug, itemVariations) => {
        this.setState({ loading: true })
        const variations = this.handleFormData(itemVariations)
        authAxios.post(addToCartURL, { slug, variations })
        .then(res => {
            this.handleFetchOrder()
            this.setState({ loading: false });
        })
        .catch(err => {
            this.setState({ error:err, loading: false });
        });
    }

    handleMinusQuantity = slug => {
        this.setState({ loading: true })
        authAxios.post(orderItemMinusURL, { slug })
        .then(res => {
            this.handleFetchOrder()
            this.setState({ loading: false });
        })
        .catch(err => {
            this.setState({ error:err, loading: false });
        });
    }

    handleFetchOrder = () => {
        this.setState({ loading: true })
        authAxios.get(orderSummaryURL)
        .then(res => {
            this.setState({ data: res.data, loading: false });
        })
        .catch(err => {
            this.setState({ error: err, loading: false });
        });
    }

    render() {
        const { data, error, loading } = this.state;
        return(
            <Container>
                <Header>Order Summary</Header>
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
                {data && (
                    <Table celled>
                        <Table.Header>
                          <Table.Row>
                            <Table.HeaderCell>Item #</Table.HeaderCell>
                            <Table.HeaderCell>Item name</Table.HeaderCell>
                            <Table.HeaderCell>Item price</Table.HeaderCell>
                            <Table.HeaderCell>Quantity</Table.HeaderCell>
                            <Table.HeaderCell>Total item price</Table.HeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {data.order_items && data.order_items.map((order_item, i) => {
                                return(
                                    <Table.Row key={order_item.id}>
                                        <Table.Cell>{i+1}</Table.Cell>
                                        <Table.Cell>{order_item.item.title}{" - "}{this.renderVariations(order_item)}</Table.Cell>
                                        <Table.Cell>${order_item.item.price}</Table.Cell>
                                        <Table.Cell textAlign='center'>
                                                <Icon
                                                    color='red'
                                                    name='minus'
                                                    style={{float:'left', cursor:'pointer'}}
                                                    onClick={() => this.handleMinusQuantity(order_item.item.slug)} />
                                                {order_item.quantity}
                                                <Icon
                                                    color='red'
                                                    name='add'
                                                    style={{float:'right', cursor:'pointer'}}
                                                    onClick={() => this.handleAddQuantity(order_item.item.slug, order_item.item_variations)} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Label ribbon>ON DISCOUNT</Label>
                                            ${order_item.final_price}
                                            <Icon
                                                color='red'
                                                name='trash alternate'
                                                style={{float:'right', cursor:'pointer'}}
                                                onClick={() => this.handleDeleteProduct(order_item.id)} />
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })}
                        </Table.Body>
                        <Table.Footer>
                          <Table.Row>
                            <Table.HeaderCell colSpan='4' textAlign="right">
                                Total :
                            </Table.HeaderCell>
                            <Table.HeaderCell colSpan='1' textAlign="center">
                                ${data.total}
                            </Table.HeaderCell>
                          </Table.Row>
                          <Table.Row>
                            <Table.HeaderCell colSpan='5' textAlign="right">
                                <Link to='/checkout'><Button color="yellow">Checkout</Button></Link>
                            </Table.HeaderCell>
                          </Table.Row>
                        </Table.Footer>
                    </Table>)
                }
            </Container>
        )
    }
}

export default OrderSummary;