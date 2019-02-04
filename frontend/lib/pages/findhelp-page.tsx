import React from 'react';

import Page from "../page";
import { GeoAutocomplete, GeoAutocompleteItem } from '../geo-autocomplete';
import autobind from 'autobind-decorator';
import { GetTenantResources, GetTenantResources_tenantResources } from '../queries/GetTenantResources';
import { AppContextType, withAppContext } from '../app-context';
import { OutboundLink } from '../google-analytics';
import Helmet from 'react-helmet';
import { twoTuple } from '../util';


type QueryState = {
  mode: 'idle'
} | {
  mode: 'searching',
  address: string,
} | {
  mode: 'foundResults',
  address: string,
  latitude: number,
  longitude: number,
  results: GetTenantResources
};

interface FindhelpProps extends AppContextType {
}

interface FindhelpState {
  queryState: QueryState;
}

class FindhelpPageWithoutContext extends React.Component<FindhelpProps, FindhelpState> {
  constructor(props: FindhelpProps) {
    super(props);
    this.state = {
      queryState: { mode: 'idle' }
    };
  }

  @autobind
  onGeoResults(item: GeoAutocompleteItem) {
    const { latitude, longitude, address } = item;
    if (latitude && longitude) {
      const queryState: QueryState = { mode: 'searching', address };
      this.setState({ queryState });
      GetTenantResources.fetch(this.props.fetch, { latitude, longitude }).then(results => {
        if (this.state.queryState !== queryState) return;
        this.setState({ queryState: {
          mode: 'foundResults',
          address,
          results,
          latitude,
          longitude
        } });
      });
    } else {
      this.setState({ queryState: { mode: 'idle' } });
    }
  }

  @autobind
  onGeoNetworkError(err: Error) {
    console.log("Network error!", err);
    alert("A network error occurred! Please try again later.");
  }

  renderQueryState(): JSX.Element {
    const qs = this.state.queryState;
    switch (qs.mode) {
      case "idle":
      return <p>Please use the address field to search for tenant resources.</p>;

      case "foundResults":
      const resources = qs.results && qs.results.tenantResources;
      if (resources) {
        return <TenantResources
          resources={resources}
          address={qs.address}
          latitude={qs.latitude}
          longitude={qs.longitude}
          mapboxAccessToken={this.props.server.mapboxAccessToken}
          mapboxTilesOrigin={this.props.server.mapboxTilesOrigin}
          staticURL={this.props.server.staticURL}
        />;
      } else {
        return <p>The server does not support finding tenant resources.</p>;
      }

      case "searching":
      return <p>Searching for tenant resources near {qs.address}...</p>;
    }
  }

  render() {
    return <Page title="Find help">
      <h1 className="title">Find help</h1>
      <GeoAutocomplete label="Your address" htmlAutocomplete="off" onChange={this.onGeoResults} onNetworkError={this.onGeoNetworkError} />
      <div className="content">
        {this.renderQueryState()}
      </div>
    </Page>;
  }
}

const FindhelpPage = withAppContext(FindhelpPageWithoutContext);

export default FindhelpPage;

interface TenantResourcesProps {
  resources: GetTenantResources_tenantResources[],
  address: string,
  latitude: number,
  longitude: number,
  mapboxAccessToken: string,
  mapboxTilesOrigin: string,
  staticURL: string
}

class TenantResources extends React.Component<TenantResourcesProps> {
  rl: typeof import('react-leaflet')|null = null;
  L: typeof import('leaflet')|null = null;

  componentDidMount() {
    import('leaflet').then(leaflet => {
      this.L = leaflet;
      this.L.Icon.Default.imagePath = `${this.leafletBaseURL}images/`;
      import('react-leaflet').then(reactLeaflet => {
        this.rl = reactLeaflet;
        this.forceUpdate();
      })
    });
  }

  get leafletBaseURL(): string {
    return `${this.props.staticURL}findhelp/vendor/leaflet-1.4.0/`;
  }

  createColorMarker(L: typeof import('leaflet'), color: 'black'|'blue'|'green'|'grey'|'orange'|'red'|'violet'|'yellow'): import('leaflet').Icon {
    return new L.Icon({
      iconUrl: `${this.props.staticURL}findhelp/vendor/leaflet-color-markers/img/marker-icon-2x-${color}.png`,
      shadowUrl: `${this.leafletBaseURL}images/marker-shadow.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  renderResource(res: GetTenantResources_tenantResources): JSX.Element {
    const name = res.website
      ? <OutboundLink href={res.website} target="_blank">{res.name}</OutboundLink>
      : res.name;
    return (
      <>
        <p>{name}</p>
        <p>{res.address}</p>
        <p className="is-size-7">{res.milesAway.toFixed(2)} miles away</p>
      </>
    );
  }

  renderMap(): JSX.Element|null {
    const { props } = this;

    if (this.rl && this.L && props.mapboxAccessToken) {
      const { Map, TileLayer, Marker, Popup } = this.rl;
      const { L } = this;
      const id = 'mapbox.streets';
      const tileLayerURL = `${props.mapboxTilesOrigin}/v4/${id}/{z}/{x}/{y}.png?access_token=${props.mapboxAccessToken}`;  
      const position = twoTuple(props.latitude, props.longitude);
      const features = new L.FeatureGroup();
      const greenIcon = this.createColorMarker(L, 'green');
      features.addLayer(L.marker(position));
      props.resources.forEach(res => {
        features.addLayer(L.marker([res.latitude, res.longitude]));
      });
      return (
        <>
          <br/>
          <Helmet>
            <link rel="stylesheet" href={`${this.leafletBaseURL}leaflet.css`} />
          </Helmet>
          <Map bounds={features.getBounds()} style={{
            height: '500px'
          }}>
            <TileLayer url={tileLayerURL}/>
            <Marker position={position} icon={greenIcon}>
              <Popup>
                <strong>Your address</strong><br/>
                {this.props.address}
              </Popup>
            </Marker>
            {props.resources.map(res => (
              <Marker position={[res.latitude, res.longitude]} key={res.name}>
                <Popup>
                  {this.renderResource(res)}
                </Popup>
              </Marker>
            ))}
          </Map>
        </>
      );
    }
    return null;
  }

  render() {
    const { props } = this;

    return (
      <>
        <p>Found {props.resources.length} tenant resources near {props.address}.</p>
        {this.renderMap()}
        <br/>
        <ol>
          {props.resources.map(res => (
            <li key={res.name}>{this.renderResource(res)}<br/></li>
          ))}
        </ol>
      </>
    );
  }
}
