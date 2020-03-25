import React, { useState } from 'react'
import { SimpleProgressiveEnhancement } from './progressive-enhancement';

const MoratoriumBanner = () => {
    
    const [isVisible, setVisibility] = useState(true);

    return (
    <section className={"jf-moratorium-banner hero is-warning is-small " + (!isVisible && "is-hidden")}>
        <div className="hero-body">
        <div className="container">
            <SimpleProgressiveEnhancement>
                <button className="delete is-medium is-pulled-right" onClick = {() => setVisibility(false)} />
            </SimpleProgressiveEnhancement>
            <p>
                <span className="has-text-weight-bold">COVID-19 Update: </span>
                JustFix.nyc is still in operation, and we are adapting our products to match new rules put in place during the Covid-19 public health crisis. 
                Thanks to organizing from tenant leaders, renters now have stronger protections during this time, including a full halt on eviction cases. 
                {' '}<a href="https://www.righttocounselnyc.org/moratorium_faq" rel="noopener noreferrer">
                    <span className="has-text-weight-bold">Learn more</span>
                </a>
            </p>
        </div>
        </div>
    </section>
    );
}

  export default MoratoriumBanner;