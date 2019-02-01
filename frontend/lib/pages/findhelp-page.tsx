import React from 'react';

import Page from "../page";
import { GeoAutocomplete, GeoAutocompleteItem } from '../geo-autocomplete';
import autobind from 'autobind-decorator';
import { GetTenantResources, GetTenantResources_tenantResources } from '../queries/GetTenantResources';
import { AppContextType, withAppContext } from '../app-context';
import { OutboundLink } from '../google-analytics';


type QueryState = {
  mode: 'idle'
} | {
  mode: 'searching',
  address: string,
} | {
  mode: 'foundResults',
  address: string,
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
        this.setState({ queryState: { mode: 'foundResults', address, results } });
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
        return <TenantResources resources={resources} address={qs.address} />;
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
  address: string
}

function TenantResources({ resources, address }: TenantResourcesProps) {
  return (
    <>
      <p>Found {resources.length} tenant resources near {address}.</p>
      <br/>
      <ol>
        {resources.map(res => {
          const name = res.website
            ? <OutboundLink href={res.website} target="_blank">{res.name}</OutboundLink>
            : res.name;
          return (
            <li key={res.name}>
              <p>{name}</p>
              <p>{res.address}</p>
              <p className="is-size-7">{res.milesAway.toFixed(2)} miles away</p>
              <br/>
            </li>
          );
        })}
      </ol>
    </>
  );
}
