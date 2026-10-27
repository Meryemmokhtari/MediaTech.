
      {modal === 'form' && (
        <div className="modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !saving) closeModal()
        }}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="modal-heading">
              <div>
                <span className="page-eyebrow"><span className="eyebrow-line" /> CATALOGUE MEDIATEK</span>
                <h2 id="form-title">{selectedProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
                <p className="modal-description">
                  {selectedProduct ? 'Modifiez les informations puis enregistrez.' : 'Renseignez les informations du nouveau produit.'}
                </p>
              </div>
              <button className="icon-button" onClick={closeModal} disabled={saving} aria-label="Fermer">
                <X size={19} />
              </button>
            </div>

            <form className="product-form" onSubmit={saveProduct}>
              <label>
                Nom du produit *
                <input
                  autoFocus
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex. Laptop HP"
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du produit..."
                />
              </label>

              <div className="form-grid">
                <label>
                  Prix (MAD) *
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="6500"
                  />
                </label>
                <label>
                  Quantité en stock *
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                  />
                </label>
              </div>

              <label>
                Catégorie *
                <input
                  required
                  maxLength={100}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex. Ordinateurs"
                  list="product-categories"
                />
                <datalist id="product-categories">
                  {categories.filter((c) => c !== 'Toutes').map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>

              <label>
                URL de l’image (facultatif)
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://exemple.com/image.jpg"
                />
              </label>

              {formError && (
                <div className="form-error" role="alert">
                  <AlertTriangle size={16} /> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                  {saving ? 'Enregistrement...' : selectedProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
                <button className="secondary-button" type="button" disabled={saving} onClick={closeModal}>
                  Annuler
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App