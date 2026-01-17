import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as bootstrap from 'bootstrap';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setisAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");
  const productModalRef = useRef(null);
 

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common.Authorization = token;
    checkAdmin();
    productModalRef.current = new bootstrap.Modal('#productModal', {
      backdrop: 'static',
      keyboard: false
    })
    
  }, []);


  const checkAdmin = async () => {
    try {
      await axios.post(`${API_BASE}/api/user/check`);
      setisAuth(true);
      getProducts();
    } catch (err) {
      console.log(err.response.data.message);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleModalInputChange = (e) => {
    const { id, value, checked, type } = e.target;
    setTempProduct((prevData) => ({
      ...prevData,
      [id]: type === "checkbox" ? checked : value,
    }));
  }

  const handleModalImageChange = (index, value) => {
    setTempProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value

      if(value !== "" && index === newImage.length - 1 && newImage.length < 5) {
        newImage.push("");
      }

      if(value === "" && newImage.length > 1 && newImage[newImage.length - 1] === "") {
        newImage.pop();
      } 

      return {
        ...pre,
        imagesUrl: newImage,
      }
    });
  }

  const handleAddImage = () => {
    setTempProduct((pre) => {
      const newImage = [...pre.imagesUrl];

      if(newImage.length < 5) {
        newImage.push("");
      } else {
        alert("已達圖片新增上限");
      }

      return {
        ...pre,
        imagesUrl: newImage,
      }
    });
  }

  const handleRemoveImage = () => {
    setTempProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage,
      }
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common.Authorization = token;
      setisAuth(true);
      getProducts();
    } catch (error) {
      alert("登入失敗: " + error.response.data.message);
    }
  };

  const getProducts = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
        setProducts(response.data.products);
      } catch (error) {
        alert("取得產品失敗: " + error.response.data.message);
      }
  }

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";

    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      method = "put";
    }

    const productData = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.is_enabled),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
        imagesUrl: [...tempProduct.imagesUrl.filter(image => image !== "")],
      }
    }

    try {
      const response = await axios[method](url, productData);
      getProducts();
      closeModal();
    } catch (error) {
      alert("新增失敗: " + error.response.data.message);
    }
  }

  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      getProducts();
      closeModal();
    } catch (error) {
      alert("刪除失敗: " + error.response.data.message);
    }
  }

  const openModal = (type, product) => {
    setModalType(type);
    setTempProduct((pre) => ({
      ...pre,
      ...product
    }));
    productModalRef.current.show() // 開啟 modal
  }

  const closeModal = () => {
    productModalRef.current.hide() // 關閉 modal
  }

  return (
    <>
      {isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button className="btn btn-primary" onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}>建立新的產品</button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  return (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <td>{product.title}</td>
                      <td className="text-end">{product.origin_price}</td>
                      <td className="text-end">{product.price}</td>
                      <td>
                        {product.is_enabled ? (
                          <span className="text-success">啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openModal("edit", product)}>
                            編輯
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal("delete", product)}>
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    />
                  <label htmlFor="password">Password</label>
                </div>
                <button
                  className="btn btn-lg btn-primary w-100 mt-3"
                  type="submit"
                  >
                  登入
                </button>
              </form>
            </div>
          </div>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
        >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === "create" ? "新增產品" : modalType === "edit" ? "編輯產品": "刪除產品"}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeModal}
                ></button>
            </div>
            <div className="modal-body">
              {
                modalType === "delete" ? (
                  <div className="modal-body">
                    <p className="fs-4">
                      確定要刪除
                      <span className="text-danger">{tempProduct.title}</span>嗎？
                    </p>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-sm-4">
                      <div className="mb-2">
                        <div className="mb-3">
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            id="imageUrl"
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={tempProduct.imageUrl}
                            onChange={handleModalInputChange}
                            />
                        </div>
                        {
                          tempProduct.imageUrl && (
                            <img className="img-fluid" src={tempProduct.imageUrl} alt="主圖" />
                          )
                        }
                      </div>
                        <div>
                          <div className="border border-2 border-dashed rounded-3 p-3">
                            {tempProduct.imagesUrl?.map((image, index) => (
                              <div key={index} className="mb-2">
                                <label
                                  htmlFor={`imagesUrl-${index + 1}`}
                                  className="form-label"
                                >
                                  副圖 {index + 1}
                                </label>
                                <input
                                  id={`imagesUrl-${index + 1}`}
                                  type="text"
                                  placeholder={`圖片網址 ${index + 1}`}
                                  className="form-control mb-2"
                                  value={image}
                                  onChange={(e) => handleModalImageChange(index, e.target.value)}
                                />
                                {image && (
                                  <img
                                    src={image}
                                    alt={`副圖 ${index + 1}`}
                                    className="img-fluid mb-2"
                                  />
                                )}
                              </div>
                            ))}
                      </div>
                        <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={handleAddImage}>
                          新增圖片
                        </button>
                      </div>
                      <div>
                        <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={handleRemoveImage}>
                          刪除圖片
                        </button>
                      </div>
                    </div>
                    <div className="col-sm-8">
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">標題</label>
                        <input
                          id="title"
                          type="text"
                          className="form-control"
                          placeholder="請輸入標題"
                          value={tempProduct.title}
                          onChange={handleModalInputChange}
                          />
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="category" className="form-label">分類</label>
                          <input
                            id="category"
                            type="text"
                            className="form-control"
                            placeholder="請輸入分類"
                            value={tempProduct.category}
                            onChange={handleModalInputChange}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="unit" className="form-label">單位</label>
                          <input
                            id="unit"
                            type="text"
                            className="form-control"
                            placeholder="請輸入單位"
                            value={tempProduct.unit}
                            onChange={handleModalInputChange}
                            />
                        </div>
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="origin_price" className="form-label">原價</label>
                          <input
                            id="origin_price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入原價"
                            value={tempProduct.origin_price}
                            onChange={handleModalInputChange}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="price" className="form-label">售價</label>
                          <input
                            id="price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入售價"
                            value={tempProduct.price}
                            onChange={handleModalInputChange}
                            />
                        </div>
                      </div>
                      <hr />

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">產品描述</label>
                        <textarea
                          id="description"
                          className="form-control"
                          placeholder="請輸入產品描述"
                          value={tempProduct.description}
                          onChange={handleModalInputChange}
                          ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="content" className="form-label">說明內容</label>
                        <textarea
                          id="content"
                          className="form-control"
                          placeholder="請輸入說明內容"
                          value={tempProduct.content}
                          onChange={handleModalInputChange}
                          ></textarea>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            id="is_enabled"
                            className="form-check-input"
                            type="checkbox"
                            checked={tempProduct.is_enabled}
                            onChange={handleModalInputChange}
                            />
                          <label className="form-check-label" htmlFor="is_enabled">
                            是否啟用
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              {
                modalType === "delete" ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => deleteProduct(tempProduct.id)}
                    >
                      刪除
                    </button>
                ) : ( 
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeModal}
                      >
                      取消
                    </button>
                    <button type="button" 
                    className="btn btn-primary" 
                    onClick={() => updateProduct(tempProduct.id)}>
                      確認
                    </button>
                  </>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
