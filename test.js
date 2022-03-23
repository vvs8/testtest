import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../support/UserState';
import Link from 'next/link'
import styles from '../css/Cart.module.css'
import { getCart } from './cartHelpers';
import { createOrder } from '../../actions/order';
import { getImages } from '../../indexeddb/idbutil'
import Footer from '../Footer';
import Card from './Card';
import { isAuth } from '../../actions/auth';
import {MdRemove} from 'react-icons/md'
import {HiOutlineLink} from 'react-icons/hi' 
import Divider from '@mui/material/Divider';


const Cart = () => {
    const [items, setItems] = useState([]);
    const [run, setRun] = useState(false);
    
    const [values, setValues] = useState({
        addresses: [],
        error: false,
        success: false,
        loading: false,
    });

    const {userState, getAddress} = useContext(UserContext)
    
    useEffect(() => {
        if(userState.user)
            setValues({...values, addresses: userState.user.addresses}); 
    }, [userState]);
   
    const sortItems = (m) => {
        const A = []
        const types = ['garden', 'cleaning']
        for(let i in types) {
            const res = m.filter(c => c.type === types[i])
            if (res.length !== 0)
                A.push([res])
        }
        setItems(A);
    }

    useEffect(() => {
        sortItems(getCart())
    }, [run]);

    const submitOrder = async () => {
        const d = items.map(({id, Notes, Period}) => ({id, Notes, Period}));
        for(let i in d)
            d[i].images = await getImages(d[i].id)
        console.log(d)
        const send = await createOrder(d)
    }

    const [subflag, setSubflag] = useState(-1)
    const [catflag, setCatflag] = useState(-1)

    const setFlags = (sub, cat) => {
        setSubflag(sub)
        setCatflag(cat)
    }

    const breakItems = (cat_i, sub_i, ser_i) => {
        const A = items
        if (A[cat_i][sub_i].length <= 1 ) return
        else {
            const len = A[cat_i][sub_i].length
            const B = A[cat_i][sub_i].splice(ser_i, 1)
            if (ser_i >= len/2)
                A[cat_i].splice(sub_i+1, 0, B);
            else 
                A[cat_i].splice(sub_i, 0, B);
            setItems([...A])
        }
    }

    const combineItems = (cat_i, sub_i, new_sub_i) => {
        const A = items
        if(A[cat_i].length <= 1) return
        if(sub_i === new_sub_i) return
        if(sub_i === -1) return
        else { 
            const B = A[cat_i][sub_i]
            if(sub_i < new_sub_i)
                for(var i = B.length - 1; i >= 0; i--) {
                    A[cat_i][new_sub_i].unshift(B[i])
                }
            else 
                for(let i in B) 
                    A[cat_i][new_sub_i].push(B[i])
            A[cat_i].splice(sub_i, 1);
            setItems([...A])
            setFlags(-1,-1)
        }
    }

    const showItems = (data, cat_i, sub_i) => {
        return (
            <>
                <div>
                    <br></br>
                    <div className={styles.title_order}>
                        <h3 style={{paddingInline:'25px'}}>Order #{(sub_i)+1}</h3>
                        <h3 style={{paddingInline:'25px'}}>{`${data.length}`} {data.length > 1 ? 'services': 'service'}</h3>
                    </div>
                    <br></br>
                    <div className={styles.serlist_cont}>
                    {data.map((service, i) => (
                        <>
                        <Divider>
                        </Divider>
                        <div className={styles.disjoint_line}>  
                            {(data.length > 1 && subflag === -1) ? <a onClick={()=>breakItems(cat_i, sub_i, i)}><MdRemove className={styles.unlink_but}/></a> : <a><MdRemove className={styles.unlink_but_inact}/></a>}
                        </div>
                        <Card
                            key={i}
                            product={service}
                            number={i+1}
                            setRun={setRun}
                            run={run}
                        />
                        <br/>
                        </>
                    ))}
                    </div>
                </div>
            </>
        );
    };

    const byCat = (items, cat_i) => {
        return (
            <>
            {items.map((e, sub_i) => (
                <div className={!(catflag===cat_i && subflag!==sub_i && subflag!==-1) ? styles.subcat_container : styles.subcat_container_active} key={sub_i}>
                    <a onClick={(catflag===cat_i && subflag!==sub_i && subflag!==-1) ? ()=>combineItems(cat_i, subflag, sub_i) : null}>
                        {showItems(e, cat_i, sub_i)}
                        {items.length>1 && <a onClick={()=>setFlags(sub_i, cat_i)}><HiOutlineLink className={styles.link_but}/></a>}
                    </a>
                </div>
            ))}
            </>
        )
    }

    const showAll = items => {
        return (
            <>
            {items.map((e, i) => (
                <>
                <div className={styles.middle_cont} key={i}>
                    <br/>
                    {byCat(e, i)}
                    <br/>
                </div>
                <br/>
                <br/>
                </>
            ))}
            </>
        )
    }

    const noItemsMessage = () => (
        <h2>
            Your cart is empty. <br /> <Link href="/shop">Continue shopping</Link>
        </h2>
    );

    const Preview = () => (
        <div >
            <br></br>
            <div className={styles.button_cont}>
                <a className={styles.request_button} onClick={()=>setStep(step+1)}> Request</a>
            </div>
            <br/>
            <br/>
            <div>{items.length > 0 ? showAll(items) : noItemsMessage()}</div>     
        </div>
    )

    

    const [step, setStep] = useState(0)

    const Second = (props) => {

        if (!isAuth())
            return (
                <div className={styles.login_page}>
                    <div className={styles.isauth}>
                        
                        <div className={styles.isauth_sub}>
                        <h5>Please sign in before continuing your order.</h5>
                        <br/>
                            <Link href={{pathname:"/signin", query: { return: 'cart' }}}>
                                <div className={styles.isauth_button}>
                                    Sign In
                                </div>
                            </Link>
                            <br/>
                            <br/>
                            <br/>
                            <h5>Don't have an account?</h5>
                            <br/>
                            <Link href="/signup">
                                <div className={styles.isauth_button}>
                                    Create an Account
                                </div>
                            </Link>  
                        </div>
                        <br/>
                        <div className={styles.guest_link}>
                            <a>
                                Continue as a guest
                            </a>
                        </div>
                    </div>
                </div>
        )
        else return (
            <div>
                <div className={styles.sec_main_container}>
                    <p>{values.addresses[0].country}</p>
                </div>
            </div>
        )
    }

    const Send = () => {
        return (
            <>
            <div>
            <button onClick={()=>submitOrder()}> SUBMIT </button>
            </div>
            </>
        )
    }

    function Dispatcher(c) {
        switch(c.c) {
            case 0:
                return <Preview/>
                break;
            case 1:
                return <Second/>
                break;
            case 2:
                return <Send/>
                break;
        } 
    }

    return (
        <>
        <div className={styles.back_cont}>
            <div className={styles.main_cont}>
            
            
            <div>
                <Dispatcher c={step}/>
            </div>
            <br></br>
            <br></br>
            <br></br>
            </div>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
        </div>
        
        <Footer/>
        </>
    );
};

export default Cart;
