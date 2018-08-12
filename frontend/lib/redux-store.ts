import { createStore, Store, applyMiddleware, Middleware } from 'redux';

import { fetchSimpleQuery } from './queries/SimpleQuery';

type SimpleQueryState = {
  state: 'pending'
} | {
  state: 'ok'
  result: string
} | {
  state: 'error'
};

export type AppAction = {
  type: 'set-user';
  username: string|null;
} | {
  type: 'fetch-simple-query';
  thing: string;
} | {
  type: 'simple-query-ok';
  result: string;
} | {
  type: 'simple-query-error';
};

export interface AppState {
  simpleQuery?: SimpleQueryState;
  username: string|null;
}

declare module 'redux' {
  // It seems we need to extend the type definition of dispatch to support
  // our own app's actions, or else we won't type-check properly.
  export interface Dispatch {
    (action: AppAction): AppState;
  }
}

const INITIAL_STATE: AppState = { username: null };

function reducer(state: AppState = INITIAL_STATE, action: AppAction): AppState {
  switch (action.type) {
    case 'set-user':
    return { ...state, username: action.username };

    case 'fetch-simple-query':
    return { ...state, simpleQuery: { state: 'pending' } };

    case 'simple-query-ok':
    return { ...state, simpleQuery: { state: 'ok', result: action.result } };

    case 'simple-query-error':
    return { ...state, simpleQuery: { state: 'error' } };
  }

  return state;
}

export type AppStore = Store<AppState, AppAction>;

type AppDispatch = (action: AppAction) => AppState;

const simpleQueryMiddleware: Middleware<{}, AppState, AppDispatch> = api => next => (action: AppAction): AppState => {
  if (action.type === 'fetch-simple-query') {
    fetchSimpleQuery({ thing: action.thing }).then(result => {
      api.dispatch({ type: 'simple-query-ok', result: result.hello });
    }).catch(e => {
      api.dispatch({ type: 'simple-query-error' });
    });
  }

  return next(action);
};

export function createAppStore(): AppStore {
  return createStore(
    reducer,
    applyMiddleware(simpleQueryMiddleware)
  );
}
