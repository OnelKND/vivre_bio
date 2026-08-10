"use client";

import { useActionState, type ChangeEvent } from "react";
import { useRef, useState } from "react";
import Image from "next/image";
import type { Category } from "@/lib/categories";
import type { Product } from "@/lib/products";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/admin/produits/actions";

const initialState: ProductFormState = { status: "idle" };

interface ProductFormProps {
  categories: Category[];
  product?: Product;
  q?: string;
}

export default function ProductForm({
  categories,
  product,
  q,
}: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(
    null,
  );
  const [deleteCurrentImage, setDeleteCurrentImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    setSelectedImageName(file?.name ?? null);
    if (file) {
      setDeleteCurrentImage(false);
    }
  };

  const clearImageSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      setSelectedImageName(null);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {q && <input type="hidden" name="q" value={q} />}
      {product && (
        <>
          <input type="hidden" name="id" value={product.id} />
        </>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="font-medium text-sm">
          Nom du produit
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          className="input border border-base-300 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="font-medium text-sm">
          Catégorie
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={product?.category ?? categories[0]?.slug}
          className="select border border-base-300 w-full"
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="shortDescription" className="font-medium text-sm">
          Description courte
        </label>
        <input
          id="shortDescription"
          name="shortDescription"
          required
          defaultValue={product?.shortDescription}
          className="input border border-base-300 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="font-medium text-sm">
          Description complète
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={product?.description}
          className="textarea border border-base-300 w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="font-medium text-sm">
            Prix (FCFA)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={1}
            required
            defaultValue={product?.price}
            className="input border border-base-300 w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="volumeMl" className="font-medium text-sm">
            Volume (ml)
          </label>
          <input
            id="volumeMl"
            name="volumeMl"
            type="number"
            min={1}
            required
            defaultValue={product?.volumeMl}
            className="input border border-base-300 w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stock" className="font-medium text-sm">
          Stock disponible
        </label>
        <input
          id="stock"
          name="stock"
          type="number"
          min={0}
          required
          defaultValue={product?.stock}
          className="input border border-base-300 w-full max-w-40"
        />
        <p className="text-xs text-base-content/50">
          À 0, le produit affiche « Épuisé » et ne peut plus être ajouté au panier.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="image" className="font-medium text-sm">
          Image{" "}
          {product ? "(laisser vide pour garder l'actuelle)" : "(facultative)"}
        </label>
        {product && (
          <div className="w-24 h-24 relative rounded-box overflow-hidden bg-base-200 mb-2">
            <Image src={product.image} alt="" fill className="object-cover" />
          </div>
        )}
        {product && (
          <div className="flex flex-col gap-2 p-3 rounded-box border border-base-300 bg-base-100 mb-2">
            <p className="text-sm text-base-content/80">
              Si tu veux supprimer la photo actuelle sans en mettre une
              nouvelle, coche cette case.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="deleteImage"
                checked={deleteCurrentImage}
                onChange={(event) =>
                  setDeleteCurrentImage(event.target.checked)
                }
                className="checkbox checkbox-secondary"
              />
              <span className="text-sm">Supprimer l&apos;image actuelle</span>
            </label>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="file-input border border-base-300 w-full"
            onChange={handleImageChange}
          />
          {selectedImageName && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={clearImageSelection}
            >
              Effacer
            </button>
          )}
        </div>
        <p className="text-xs text-base-content/50">
          JPG, PNG ou WEBP, 5 Mo maximum.{" "}
          {!product &&
            "Sans photo, un visuel provisoire avec l'initiale du produit sera utilisé."}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="whatsappCatalogUrl" className="font-medium text-sm">
          Lien du produit dans le catalogue WhatsApp Business (facultatif)
        </label>
        <input
          id="whatsappCatalogUrl"
          name="whatsappCatalogUrl"
          type="url"
          placeholder="https://wa.me/c/..."
          defaultValue={product?.whatsappCatalogUrl ?? ""}
          className="input border border-base-300 w-full"
        />
        <p className="text-xs text-base-content/50">
          Depuis WhatsApp Business, ouvre l&apos;article dans le catalogue,
          appuie sur « Partager » puis « Copier le lien », et colle-le ici.
          S&apos;il est renseigné, le bouton « Commander sur WhatsApp » de la
          fiche produit y renverra directement ; sinon il ouvre une
          conversation avec un message pré-rempli.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={product?.featured}
          className="checkbox checkbox-primary"
        />
        <span className="text-sm">
          Mettre en avant sur la page d&apos;accueil
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="text-accent text-sm">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary self-start"
      >
        {pending
          ? "Enregistrement..."
          : product
            ? "Mettre à jour"
            : "Créer le produit"}
      </button>
    </form>
  );
}
