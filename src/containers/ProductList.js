import React, { Component } from 'react'
import { Button, Icon, Image, Item, Label, Segment, Loader, Dimmer, Message, Input, Menu, Grid } from 'semantic-ui-react'
import axios from 'axios'

import { connect } from 'react-redux'
import { productListURL, searchListURL } from '../constants'

import { cartFetch } from '../store/actions/cart'

class ProductList extends Component {

    state = {
        loading: false,
        error: null,
        data: null,
        activeItem: 'all',
        count:{'shirt': 0, 'pant': 0},
        search: ""
    }

    componentDidMount() {
        this.handleFetchAddresses()
    }

    handleFetchAddresses = () => {
        this.setState({ loading: true })
        axios.get(productListURL)
        .then(res => {
            var i, x = 0, y = 0, raw = res.data;
            for (i=0;i<raw.length;i++) {
                if (raw[i].category === 'Shirt') {
                    x+=1;
                } else {
                    y+=1;
                }
            }
            this.setState({ data: res.data, loading: false, count:{'shirt': x, 'pant': y} });
        })
        .catch(err => {
            this.setState({ error:err, loading: false });
        });
    }

    handleItemClick = (e, { name }) => this.setState(
            { activeItem: name },
            () => { this.handleFetchAddresses()}
        )

    handleSearch = (e) => {
        if(e.charCode === 13) {
            this.setState({ loading: true })
            axios.get(searchListURL(e.target.value))
            .then(res => {
                console.log(res.data)
                this.setState({ loading: false, data: res.data, activeItem:'all' });
            })
            .catch(err => {
                this.setState({ error:err, loading: false });
            });
      }
    }

    render() {
        const { data, error, loading, activeItem, count } = this.state;
        console.log(count)
        return (
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
                <Grid.Column width={3}>
                    <Menu vertical pointing fluid>
                        <Menu.Item
                          name='all'
                          active={activeItem === 'all'}
                          onClick={this.handleItemClick}
                        >
                          <Label color='teal'>4</Label>
                          All
                        </Menu.Item>

                        <Menu.Item
                          name='shirt'
                          active={activeItem === 'shirt'}
                          onClick={this.handleItemClick}
                        >
                          <Label>{count.shirt}</Label>
                          Shirts
                        </Menu.Item>

                        <Menu.Item
                          name='pant'
                          active={activeItem === 'pant'}
                          onClick={this.handleItemClick}
                        >
                          <Label>{count.pant}</Label>
                          Pants
                        </Menu.Item>
                        <Menu.Item>
                          <Input icon='search' placeholder='Search...' onKeyPress={this.handleSearch}/>
                        </Menu.Item>
                    </Menu>
                </Grid.Column>
                <Grid.Column width={13}>
                    <Item.Group divided>
                        {data && data.map(item => {
                            if (item.category.toLowerCase() === activeItem | activeItem === 'all') {
                                return (
                                    <Item key={item.id}>
                                      <Item.Image as='a' src={item.image} onClick={() => this.props.history.push(`/products/${item.id}`)} />
                                      <Item.Content>
                                        <Item.Header as='a' onClick={() => this.props.history.push(`/products/${item.id}`)}>{item.title}</Item.Header>
                                        <Item.Meta>
                                          <span className='cinema'>{item.category}</span>
                                        </Item.Meta>
                                        <Item.Description>{item.description}</Item.Description>
                                        <Item.Extra>
                                          <Button primary floated='right' icon labelPosition="right" onClick={() => this.props.history.push(`/products/${item.id}`)}>
                                            More Detail
                                            <Icon name='angle double right' />
                                          </Button>
                                          {item.price_discount &&
                                           <Label color={
                                           item.label === 'primary' ? 'red' :
                                           item.label === 'secondary' ? 'green' : 'olive'}>
                                           {item.label}
                                           </Label>}
                                        </Item.Extra>
                                      </Item.Content>
                                    </Item>
                                )} else
                                    return <div></div>
                                })}
                    </Item.Group>
                </Grid.Column>
            </Grid.Row>
        </Grid>
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

export default connect(null, mapDispatchToProps)(ProductList)