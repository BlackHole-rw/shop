import React, { Component } from 'react'
import { Button,
         Container,
         Icon,
         Image,
         Divider,
         Item,
         Label,
         Form,
         Segment,
         Loader,
         Dimmer,
         Message,
         Card,
         Grid,
         Header,
         Select
} from 'semantic-ui-react'

import axios from 'axios'
import { withRouter } from 'react-router-dom'

import { connect } from 'react-redux'
import { productDetailURL, addToCartURL } from '../constants'
import { authAxios } from '../utils'
import { cartFetch } from '../store/actions/cart'

class ProductDetail extends Component {

    state = {
        loading: false,
        error: null,
        formVisible: false,
        data: null,
        formData: {}
    }

    componentDidMount() {
        this.handleFetchItem();
    }

    handleToggleForm = () => {
        const { formVisible } = this.state;
        this.setState({
            formVisible: !formVisible
        })
    }

    handleFetchItem = () => {
        this.setState({ loading: true })
        const { match: {params} } = this.props;
        axios.get(productDetailURL(params.productID))
        .then(res => {
            this.setState({ data: res.data, loading: false });
        })
        .catch(err => {
            this.setState({ error:err, loading: false });
        });
    }

    handleFormData = formData => {
    // convert [{size:1},{color:2}] to [1, 2] - they're all variations
        return Object.keys(formData).map(key => {
            return formData[key];
        })
    }

    handleAddToCart = slug => {
        this.setState({ loading: true })
        const {formData} = this.state;
        const variations = this.handleFormData(formData);
        authAxios.post(addToCartURL, { slug, variations })
        .then(res => {
            this.props.cartFetch();
            this.setState({ loading: false });
        })
        .catch(err => {
            this.setState({ error:err, loading: false });
        });
    }

    handleChange = (e, {name, value}) => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            [name]:value
        }
        this.setState({ formData: updateFormData })
    }

    render() {
        const { data, error, loading, formVisible, formData } = this.state;
        const item = data
        return (
        <Container>
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

            {item && (
            <Grid columns={2} divided>
                <Grid.Row>
                  <Grid.Column>
                    <Card
                        fluid
                        image={item.image}
                        header={item.title}
                        meta={(
                        <React.Fragment>
                            {item.category}
                            {item.price_discount &&
                               <Label color={
                               item.label === 'primary' ? 'red' :
                               item.label === 'secondary' ? 'green' : 'olive'}>
                               {item.label}
                               </Label>}
                        </React.Fragment>
                        )}
                        description={item.description}
                        extra={<React.Fragment>
                              <Button
                                    fluid
                                    primary
                                    floated='right'
                                    icon
                                    labelPosition="right"
                                    onClick={this.handleToggleForm}
                              >
                                Add to cart
                                <Icon name='cart plus' />
                              </Button>
                            </React.Fragment>}
                      />
                      {formVisible && (
                        <React.Fragment>
                            <Divider />
                            <Form>
                                {data.variations.map(v => {
                                    const name = v.name.toLowerCase();
                                    return(
                                        <Form.Field key={v.id}>
                                            <Select
                                                name={name}
                                                onChange={this.handleChange}
                                                options={v.item_variations.map(i => {
                                                    return {
                                                        key: i.id,
                                                        text: i.value,
                                                        value: i.id
                                                    }
                                                })}
                                                placeholder={`Choose a ${name}`}
                                                selection
                                                value={formData[name]}
                                              />
                                        </Form.Field>
                                    )
                                })}
                                <Form.Button primary onClick={() => this.handleAddToCart(item.slug)}>
                                    Submit
                                </Form.Button>
                            </Form>
                        </React.Fragment>
                      )}
                  </Grid.Column>
                  <Grid.Column>
                    <Header as='h2'>Try different variations</Header>
                    {data.variations &&
                        data.variations.map(v => {
                            return(
                                <React.Fragment key={v.id}>
                                    <Header as='h3'>{v.name}</Header>
                                      <Item.Group divided>
                                            {v.item_variations &&
                                                v.item_variations.map(i => {
                                                    return(
                                                        <Item key={i.id}>
                                                          {i.attachment &&
                                                          <Item.Image
                                                            size='tiny'
                                                            src={`http://127.0.0.1:8000${i.attachment}`} />
                                                           }
                                                          <Item.Content verticalAlign='middle'>{i.value}</Item.Content>
                                                        </Item>
                                                    )
                                                })
                                            }
                                      </Item.Group>
                                </React.Fragment>
                            )
                        })
                    }
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            )}
        </Container>
        );
    }
}

//const mapStateToProps = state => {
//    return{}
//}

const mapDispatchToProps = dispatch=> {
    return{
        cartFetch: () => dispatch(cartFetch())
    }
}

export default withRouter(
    connect(
        null,
        mapDispatchToProps
    )(ProductDetail));