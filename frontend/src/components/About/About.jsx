/* eslint-disable react/button-has-type */
import React from 'react';
import './About.css';

const About = () => (
    <div className="about-part">
        <h1 className="head-color text-center my-5">About Us</h1>
        <div className="container">
            <div className="row">
                <div className="col-md-7">
                    <div className="">
                        <img className="img-fluid" src="about/about.jpg" alt="" />
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="about_content">
                        <h3 className="about-p ">Baby Cares - United States </h3>
                        <p className="about-d">
                            There have been consumer questions around the effectiveness of Baby
                            Cares Cologne as a hand sanitizer or surface disinfectant. None of our
                            colognes, even those that include alcohol, are intended to be used as
                            hand sanitizers or surface disinfectants. They have not been designed or
                            tested to kill germs and are not intended to prevent or treat COVID-19.
                            Instead, we recommend following the preventive measures issued by the
                            World Health Organization or your local public health agency, including
                            washing hands frequently, using a hand sanitizer when waterless cleaning
                            is desired, maintaining social distance, not touching your eyes, nose
                            and mouth, and other appropriate preventive measures. Discover how our
                            3-step bedtime routine and the Baby Cares® Bedtime™ baby sleep app can
                            help you and your little one start sleeping better tonight. Our app
                            includes a baby sleep tracker, expert advice, lullabies and more.
                        </p>
                        <button className="custom__button">Read More</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default About;
