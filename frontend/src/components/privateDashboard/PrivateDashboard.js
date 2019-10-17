import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './PrivateDashboard.scss';
import schemaString from '../../schema/objects'
import SplitPane from 'react-split-pane'
import axios from 'axios';


class PrivateDashboard extends Component {

  state = {
    id: "",
    tabs: undefined,
    showObjects: true,
  }

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);


    /// send request 
    // Make a request for a user with a given ID
    this.getId();
    // .then(function (response) {
    //   // handle success
    //   console.log(response);
    //   this.setState({id: response})
    // }) 


  }

  getId = async () => {
    let res = await axios.get('http://localhost:4000/api/dynamic');
    if (res.status === 200) {
      this.setState({
        id: res.data, tabs: [
          {
            "endpoint": "http://localhost:4000/graphql" + res.data,
            "query": "defaultQuery",
          }
        ]
      })
    }
  }

  setPlaygroundHeight = (e) => {
    let playground = document.getElementsByClassName("playground");
    let topGrid = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (topGrid[0].offsetHeight)
    playground[0].style.height = space + "px";
  }

  render() {
    return (
      <SplitPane split="hotizontal" minSize={40} defaultSize={300} onChange={this.setPlaygroundHeight} id="spliter">

        <div className={this.state.showObjects ? "box-grid box-grid3" : "box-grid box-grid2"}>
          <div className="box-left">
            <div className="fixed-top-bar">
              <h3>RDF</h3>
              {/* <button className="rdf-compile button play"></button> */}
            </div>
            {/* <textarea className="rdf-textarea" placeholder="CODE HERE">
               
                {JSON.stringify(require('../../schema/raw-schema'), null, 2)}
            
            </textarea> */}

            {/* <div class="context-box">
              <code>
                <div><pre>{JSON.stringify(require('../../schema/raw-schema'), null, 2).split("\\n").map((item, i) => {
                  return <p key={i}>{item}</p>;
                })}</pre></div>
              </code>
            </div> */}

            <div class="context-box"> {JSON.stringify(require('../../schema/raw-schema'), null, 2).split("\\n").map((item, i) => {
              return <p key={i}>{item}</p>;
            })}
            </div>
          </div>


          <div className="box-right">
            <h3>Context</h3>
            <div class="context-box">
              <code>
                <div><pre>{JSON.stringify(require('../../schema/schema-mapping')["@context"], null, 2)}</pre></div>
              </code>
            </div>
          </div>

          {this.state.showObjects ?
            <div className="box-middle">
              <h3>Objects</h3>
              <button className="button-close" onClick={x => this.setState({ showObjects: false })}>X</button>
              <div class="context-box">
                <code>
                <div><pre>{JSON.stringify(schemaString, null, 2)}</pre></div>
              </code>
              </div>
            </div> :
            <React.Fragment>
              <button className="button-close" onClick={x => this.setState({ showObjects: true })}>Show example objects</button>
            </React.Fragment>
          }
        </div>
        <div className="box-grid">
          <div className="bottom-box">
            <Provider store={store}>
              <Playground endpoint={"http://localhost:4000/graphql" + this.state.id} className="playground" id="playground"

                tabs={this.state.tabs}



              />
            </Provider>
          </div>
        </div>
      </SplitPane >


    )
  }
}


export default PrivateDashboard;

